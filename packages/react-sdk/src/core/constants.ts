/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * SDK-wide constants for API version, header names, and default configuration.
 */

export const API_VERSION = 'v1';

export const HEADER_NAMES = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  CLIENT_PLATFORM: 'x-client-platform',
  REGION: 'x-region',
  IDEMPOTENCY_KEY: 'x-idempotency-key',
  RATE_LIMIT_LIMIT: 'x-ratelimit-limit',
  RATE_LIMIT_REMAINING: 'x-ratelimit-remaining',
  RATE_LIMIT_RESET: 'x-ratelimit-reset',
} as const;

export const DEFAULT_TIMEOUT_MS = 30_000;

export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504] as readonly number[],
} as const;
