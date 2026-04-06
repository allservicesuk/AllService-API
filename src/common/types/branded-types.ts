/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Branded string types preventing mix-ups between different ID kinds at compile time.
 */
type Brand<T, B> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TenantId = Brand<string, 'TenantId'>;
export type RefreshTokenHash = Brand<string, 'RefreshTokenHash'>;
export type RequestId = Brand<string, 'RequestId'>;
export type FamilyId = Brand<string, 'FamilyId'>;

export const toUserId = (value: string): UserId => value as UserId;
export const toSessionId = (value: string): SessionId => value as SessionId;
export const toTenantId = (value: string): TenantId => value as TenantId;
export const toRefreshTokenHash = (value: string): RefreshTokenHash => value as RefreshTokenHash;
export const toRequestId = (value: string): RequestId => value as RequestId;
export const toFamilyId = (value: string): FamilyId => value as FamilyId;
