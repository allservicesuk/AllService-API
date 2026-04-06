/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Custom HTTP header name constants; single source of truth for request and response headers.
 */
export const RequestHeaders = {
  REQUEST_ID: 'x-request-id',
  IDEMPOTENCY_KEY: 'x-idempotency-key',
  CLIENT_VERSION: 'x-client-version',
  CLIENT_PLATFORM: 'x-client-platform',
  CORRELATION_ID: 'x-correlation-id',
  SESSION_ID: 'x-session-id',
} as const;

export const ResponseHeaders = {
  REQUEST_ID: 'X-Request-Id',
  REGION: 'X-Region',
  READ_ONLY: 'X-Read-Only',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const;

export type RequestHeader = (typeof RequestHeaders)[keyof typeof RequestHeaders];
export type ResponseHeader = (typeof ResponseHeaders)[keyof typeof ResponseHeaders];
