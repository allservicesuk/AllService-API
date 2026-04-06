/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Core fetch-based HTTP client with interceptor pipeline, auth refresh, and retry logic.
 */
import type { RefreshResponse } from '../types/auth';
import { API_VERSION, DEFAULT_RETRY_CONFIG, DEFAULT_TIMEOUT_MS } from './constants';
import { AllServicesError, AllServicesNetworkError, AllServicesTimeoutError, AllServicesApiError } from './errors';
import type { ClientConfig, HttpMethod, RegionCode, RequestOptions, RateLimitInfo } from './http-client.types';
import {
  applyAuthHeader,
  applyIdempotencyHeader,
  applyPlatformHeader,
  applyRegionHeader,
} from './request-interceptors';
import {
  extractRateLimitInfo,
  mapErrorResponse,
  unwrapEnvelope,
} from './response-interceptors';
import type { RetryConfig } from './retry';
import { withRetry } from './retry';
import { TokenManager } from './token-manager';

export class AllServicesClient {
  readonly tokenManager: TokenManager;
  private readonly config: ClientConfig;
  private readonly retryConfig: RetryConfig;
  private lastRateLimit: RateLimitInfo = { limit: null, remaining: null, resetAt: null };
  private isRefreshing = false;

  constructor(config: ClientConfig) {
    if (!config.baseUrl && !config.regionUrls) {
      throw new AllServicesError('ClientConfig requires either baseUrl or regionUrls');
    }
    this.config = config;
    this.tokenManager = new TokenManager(config.tokenStorage);
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry,
    };
  }

  get rateLimit(): RateLimitInfo {
    return this.lastRateLimit;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions & { body?: unknown },
  ): Promise<T> {
    const execute = () => this.executeRequest<T>(method, path, options);
    return withRetry(execute, this.retryConfig);
  }

  async requestBlob(
    method: HttpMethod,
    path: string,
    options?: RequestOptions,
  ): Promise<Blob> {
    const url = this.isWriteMethod(method)
      ? this.buildWriteUrl(path)
      : this.buildUrl(path);
    const headers = this.buildHeaders(method, options, true);
    const timeoutMs = options?.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options?.signal
      ? mergeAbortSignals(options.signal, controller.signal)
      : controller.signal;

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal,
        credentials: this.config.credentials ?? 'include',
      });

      clearTimeout(timeoutId);
      this.lastRateLimit = extractRateLimitInfo(response.headers);

      if (!response.ok) {
        await mapErrorResponse(response);
      }

      return response.blob();
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error);
    }
  }

  async uploadWithProgress<T>(
    method: HttpMethod,
    path: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
    options?: RequestOptions,
  ): Promise<T> {
    if (!onProgress) {
      return this.request<T>(method, path, {
        ...options,
        body: formData,
      });
    }

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = this.isWriteMethod(method)
        ? this.buildWriteUrl(path)
        : this.buildUrl(path);

      xhr.open(method, url);

      const headers = this.buildHeaders(method, options, false);
      headers.forEach((value, key) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.withCredentials = true;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText) as unknown;
            resolve(unwrapEnvelope<T>(body));
          } catch {
            reject(new AllServicesNetworkError('Failed to parse response'));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText) as { error?: { code: string; message: string; statusCode: number; requestId: string; timestamp: string; region: string; details?: unknown[]; retryAfter?: number } };
            if (body?.error) {
              reject(
                new AllServicesApiError({
                  code: body.error.code as AllServicesApiError['code'],
                  message: body.error.message,
                  statusCode: body.error.statusCode,
                  requestId: body.error.requestId,
                  timestamp: body.error.timestamp,
                  region: body.error.region,
                }),
              );
            } else {
              reject(new AllServicesNetworkError(`HTTP ${xhr.status}`));
            }
          } catch {
            reject(new AllServicesNetworkError(`HTTP ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new AllServicesNetworkError('Network request failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new AllServicesTimeoutError(xhr.timeout));
      });

      const timeoutMs = options?.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT_MS;
      xhr.timeout = timeoutMs;

      xhr.send(formData);
    });
  }

  private async executeRequest<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions & { body?: unknown },
  ): Promise<T> {
    const url = this.isWriteMethod(method)
      ? this.buildWriteUrl(path)
      : this.buildUrl(path);
    const isFormData = options?.body instanceof FormData;
    const headers = this.buildHeaders(method, options, !isFormData);
    const timeoutMs = options?.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options?.signal
      ? mergeAbortSignals(options.signal, controller.signal)
      : controller.signal;

    let body: BodyInit | undefined;
    if (options?.body !== undefined) {
      body = isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal,
        credentials: this.config.credentials ?? 'include',
      });

      clearTimeout(timeoutId);
      this.lastRateLimit = extractRateLimitInfo(response.headers);

      if (!response.ok) {
        if (response.status === 401 && !this.isRefreshing && !options?.skipAuth) {
          return this.handleUnauthorized<T>(method, path, options);
        }

        if (response.status === 503 && this.config.regionUrls) {
          const errorBody = await response.clone().json().catch(() => null) as { error?: { code?: string } } | null;
          if (errorBody?.error?.code === 'SERVICE_READ_ONLY') {
            return this.retryOnPrimary<T>(method, path, options);
          }
        }

        await mapErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const responseBody = (await response.json()) as unknown;

      if (options?.rawResponse) {
        return responseBody as T;
      }

      return unwrapEnvelope<T>(responseBody);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error);
    }
  }

  private async retryOnPrimary<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions & { body?: unknown },
  ): Promise<T> {
    const primaryUrl = this.buildWriteUrl(path);
    const isFormData = options?.body instanceof FormData;
    const headers = this.buildHeaders(method, options, !isFormData);
    const timeoutMs = options?.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options?.signal
      ? mergeAbortSignals(options.signal, controller.signal)
      : controller.signal;

    let body: BodyInit | undefined;
    if (options?.body !== undefined) {
      body = isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(primaryUrl, {
        method,
        headers,
        body,
        signal,
        credentials: this.config.credentials ?? 'include',
      });

      clearTimeout(timeoutId);
      this.lastRateLimit = extractRateLimitInfo(response.headers);

      if (!response.ok) {
        await mapErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const responseBody = (await response.json()) as unknown;
      return options?.rawResponse ? (responseBody as T) : unwrapEnvelope<T>(responseBody);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.normalizeError(error);
    }
  }

  private async handleUnauthorized<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions & { body?: unknown },
  ): Promise<T> {
    this.isRefreshing = true;

    try {
      await this.tokenManager.refresh(() => this.refreshRequest());
      this.isRefreshing = false;
      return this.executeRequest<T>(method, path, { ...options, skipAuth: false });
    } catch {
      this.isRefreshing = false;
      await this.tokenManager.clearAll();
      this.config.onAuthError?.();
      throw new AllServicesApiError({
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.',
        statusCode: 401,
        requestId: '',
        timestamp: new Date().toISOString(),
        region: this.config.region ?? 'eu',
      });
    }
  }

  private async refreshRequest(): Promise<RefreshResponse> {
    const url = this.buildWriteUrl(`/${API_VERSION}/auth/refresh`);
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.config.platform) {
      applyPlatformHeader(headers, this.config.platform);
    }

    const refreshToken = await this.tokenManager.getRefreshToken();
    const body = refreshToken ? JSON.stringify({ refreshToken }) : undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      credentials: this.config.credentials ?? 'include',
    });

    if (!response.ok) {
      await mapErrorResponse(response);
    }

    const responseBody = (await response.json()) as unknown;
    return unwrapEnvelope<RefreshResponse>(responseBody);
  }

  private getBaseUrl(forRegion?: RegionCode): string {
    if (this.config.regionUrls) {
      const region = forRegion ?? this.config.region ?? 'eu';
      return this.config.regionUrls[region].replace(/\/+$/, '');
    }
    return (this.config.baseUrl ?? '').replace(/\/+$/, '');
  }

  private getPrimaryBaseUrl(): string {
    const primary = this.config.primaryRegion ?? 'eu';
    return this.getBaseUrl(primary);
  }

  private isWriteMethod(method: string): boolean {
    return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
  }

  private buildUrl(path: string, forRegion?: RegionCode): string {
    const base = this.getBaseUrl(forRegion);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private buildWriteUrl(path: string): string {
    if (this.config.regionUrls) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${this.getPrimaryBaseUrl()}${normalizedPath}`;
    }
    return this.buildUrl(path);
  }

  private buildHeaders(
    method: string,
    options?: RequestOptions,
    setContentType?: boolean,
  ): Headers {
    const headers = new Headers();

    if (setContentType) {
      headers.set('Content-Type', 'application/json');
    }

    applyAuthHeader(headers, this.tokenManager, options?.skipAuth ?? false);

    if (this.config.platform) {
      applyPlatformHeader(headers, this.config.platform);
    }

    if (this.config.region) {
      applyRegionHeader(headers, this.config.region);
    }

    applyIdempotencyHeader(headers, method, options?.idempotencyKey);

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }

    return headers;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof AllServicesApiError) {
      return error;
    }
    if (error instanceof AllServicesNetworkError) {
      return error;
    }
    if (error instanceof AllServicesTimeoutError) {
      return error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new AllServicesTimeoutError(
        this.config.timeout ?? DEFAULT_TIMEOUT_MS,
      );
    }
    if (error instanceof TypeError) {
      return new AllServicesNetworkError('Network request failed', error);
    }
    return new AllServicesNetworkError(
      error instanceof Error ? error.message : 'Unknown error',
      error,
    );
  }
}

function mergeAbortSignals(
  userSignal: AbortSignal,
  timeoutSignal: AbortSignal,
): AbortSignal {
  const controller = new AbortController();

  const abort = () => controller.abort();
  userSignal.addEventListener('abort', abort, { once: true });
  timeoutSignal.addEventListener('abort', abort, { once: true });

  return controller.signal;
}
