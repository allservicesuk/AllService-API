/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Barrel export for the @allservices/react-sdk/client entrypoint (standalone, no React).
 */
export { AllServicesClient } from './core/http-client';

export type {
  ClientConfig,
  ClientPlatform,
  RegionCode,
  RegionUrls,
  RequestOptions,
  TokenStorage,
  HttpMethod,
  RateLimitInfo,
} from './core/http-client.types';

export type { RetryConfig } from './core/retry';

export { TokenManager } from './core/token-manager';

export {
  AllServicesError,
  AllServicesApiError,
  AllServicesNetworkError,
  AllServicesTimeoutError,
  isAllServicesApiError,
  isAllServicesNetworkError,
  isAllServicesTimeoutError,
} from './core/errors';

export { generateIdempotencyKey } from './core/idempotency';
