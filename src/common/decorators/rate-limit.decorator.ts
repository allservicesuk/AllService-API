/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Per-route rate-limit override metadata consumed by the ThrottlerBehindProxyGuard.
 */
import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitMetadata {
  readonly limit: number;
  readonly ttlSeconds: number;
}

export function RateLimit(limit: number, ttlSeconds: number): CustomDecorator<string> {
  return SetMetadata<string, RateLimitMetadata>(RATE_LIMIT_KEY, { limit, ttlSeconds });
}
