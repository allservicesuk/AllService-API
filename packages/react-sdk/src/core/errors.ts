/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Typed error classes for all SDK failure modes with helper type guards.
 */
import type { ErrorDetail } from '../types/api-envelope';
import type { ErrorCodeValue } from '../types/error-codes';

export class AllServicesError extends Error {
  override readonly name: string = 'AllServicesError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AllServicesApiError extends AllServicesError {
  override readonly name = 'AllServicesApiError';
  readonly code: ErrorCodeValue;
  readonly statusCode: number;
  readonly requestId: string;
  readonly timestamp: string;
  readonly region: string;
  readonly details: readonly ErrorDetail[] | undefined;
  readonly retryAfter: number | undefined;

  constructor(params: {
    code: ErrorCodeValue;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
    region: string;
    details?: readonly ErrorDetail[];
    retryAfter?: number;
  }) {
    super(params.message);
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.requestId = params.requestId;
    this.timestamp = params.timestamp;
    this.region = params.region;
    this.details = params.details;
    this.retryAfter = params.retryAfter;
  }

  isCode(code: ErrorCodeValue): boolean {
    return this.code === code;
  }

  isTokenExpired(): boolean {
    return this.code === 'TOKEN_EXPIRED';
  }

  isRateLimited(): boolean {
    return this.code === 'RATE_LIMITED';
  }

  isMfaRequired(): boolean {
    return this.code === 'MFA_REQUIRED';
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isValidationError(): boolean {
    return this.code === 'VALIDATION_FAILED';
  }
}

export class AllServicesNetworkError extends AllServicesError {
  override readonly name = 'AllServicesNetworkError';

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

export class AllServicesTimeoutError extends AllServicesError {
  override readonly name = 'AllServicesTimeoutError';

  constructor(public readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
  }
}

export function isAllServicesApiError(
  error: unknown,
): error is AllServicesApiError {
  return error instanceof AllServicesApiError;
}

export function isAllServicesNetworkError(
  error: unknown,
): error is AllServicesNetworkError {
  return error instanceof AllServicesNetworkError;
}

export function isAllServicesTimeoutError(
  error: unknown,
): error is AllServicesTimeoutError {
  return error instanceof AllServicesTimeoutError;
}
