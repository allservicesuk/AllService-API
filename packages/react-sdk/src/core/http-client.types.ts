/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Internal types for the HTTP client configuration and request pipeline.
 */
import type { RetryConfig } from './retry';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type ClientPlatform = 'web' | 'ios' | 'android' | 'desktop';

export type RegionCode = 'eu' | 'na';

export interface TokenStorage {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;
}

export interface RegionUrls {
  readonly eu: string;
  readonly na: string;
}

export interface ClientConfig {
  readonly baseUrl?: string;
  readonly regionUrls?: RegionUrls;
  readonly region?: RegionCode;
  readonly primaryRegion?: RegionCode;
  readonly platform?: ClientPlatform;
  readonly timeout?: number;
  readonly retry?: Partial<RetryConfig>;
  readonly credentials?: RequestCredentials;
  readonly onAuthError?: () => void;
  readonly tokenStorage?: TokenStorage;
}

export interface RequestOptions {
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
  readonly timeout?: number;
  readonly idempotencyKey?: string;
  readonly skipAuth?: boolean;
  readonly rawResponse?: boolean;
  readonly onUploadProgress?: (percent: number) => void;
}

export interface RateLimitInfo {
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly resetAt: number | null;
}
