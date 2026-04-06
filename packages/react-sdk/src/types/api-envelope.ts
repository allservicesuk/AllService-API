/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Response envelope types matching the backend TransformInterceptor and AllExceptionsFilter output.
 */
import type { ErrorCodeValue } from './error-codes';

export interface PaginationMeta {
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface ApiMeta {
  readonly requestId: string;
  readonly timestamp: string;
  readonly version: string;
  readonly region: string;
  readonly pagination?: PaginationMeta;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly meta: ApiMeta;
}

export interface ErrorDetail {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ApiErrorBody {
  readonly code: ErrorCodeValue;
  readonly message: string;
  readonly statusCode: number;
  readonly requestId: string;
  readonly timestamp: string;
  readonly region: string;
  readonly details?: readonly ErrorDetail[];
  readonly retryAfter?: number;
}

export interface ApiErrorEnvelope {
  readonly error: ApiErrorBody;
}
