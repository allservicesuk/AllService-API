/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Response interceptors for envelope unwrapping, error mapping, and rate limit extraction.
 */
import type { ApiErrorEnvelope } from '../types/api-envelope';
import { HEADER_NAMES } from './constants';
import { AllServicesApiError, AllServicesNetworkError } from './errors';
import type { RateLimitInfo } from './http-client.types';

export function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  const limitStr = headers.get(HEADER_NAMES.RATE_LIMIT_LIMIT);
  const remainingStr = headers.get(HEADER_NAMES.RATE_LIMIT_REMAINING);
  const resetStr = headers.get(HEADER_NAMES.RATE_LIMIT_RESET);

  return {
    limit: limitStr !== null ? parseInt(limitStr, 10) : null,
    remaining: remainingStr !== null ? parseInt(remainingStr, 10) : null,
    resetAt: resetStr !== null ? parseInt(resetStr, 10) : null,
  };
}

export async function mapErrorResponse(response: Response): Promise<never> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AllServicesNetworkError(
      `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const envelope = body as ApiErrorEnvelope;
  if (envelope?.error) {
    throw new AllServicesApiError({
      code: envelope.error.code,
      message: envelope.error.message,
      statusCode: envelope.error.statusCode,
      requestId: envelope.error.requestId,
      timestamp: envelope.error.timestamp,
      region: envelope.error.region,
      details: envelope.error.details,
      retryAfter: envelope.error.retryAfter,
    });
  }

  throw new AllServicesNetworkError(
    `HTTP ${response.status}: ${response.statusText}`,
  );
}

export function unwrapEnvelope<T>(body: unknown): T {
  const envelope = body as { data?: T; meta?: unknown };
  if (
    envelope !== null &&
    typeof envelope === 'object' &&
    'data' in envelope &&
    'meta' in envelope
  ) {
    return envelope.data as T;
  }
  return body as T;
}
