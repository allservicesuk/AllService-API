/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Request interceptors that attach auth, platform, region, and idempotency headers.
 */
import { HEADER_NAMES } from './constants';
import { generateIdempotencyKey } from './idempotency';
import type { ClientPlatform, RegionCode } from './http-client.types';
import type { TokenManager } from './token-manager';

export function applyAuthHeader(
  headers: Headers,
  tokenManager: TokenManager,
  skipAuth: boolean,
): void {
  if (skipAuth) {
    return;
  }
  const token = tokenManager.getAccessToken();
  if (token) {
    headers.set(HEADER_NAMES.AUTHORIZATION, `Bearer ${token}`);
  }
}

export function applyPlatformHeader(
  headers: Headers,
  platform: ClientPlatform,
): void {
  headers.set(HEADER_NAMES.CLIENT_PLATFORM, platform);
}

export function applyRegionHeader(
  headers: Headers,
  region: RegionCode,
): void {
  headers.set(HEADER_NAMES.REGION, region);
}

export function applyIdempotencyHeader(
  headers: Headers,
  method: string,
  customKey?: string,
): void {
  const needsKey =
    method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
  if (needsKey) {
    headers.set(
      HEADER_NAMES.IDEMPOTENCY_KEY,
      customKey ?? generateIdempotencyKey(),
    );
  }
}
