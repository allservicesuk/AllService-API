/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Shape returned by login, register, and refresh endpoints containing tokens and a minimal user view.
 */
export interface AuthResponseUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly roles: readonly string[];
  readonly emailVerified: boolean;
  readonly mfaEnabled: boolean;
}

export interface AuthResponseDto {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
  readonly user: AuthResponseUser;
}

export interface MfaChallengeResponseDto {
  readonly mfaRequired: true;
  readonly mfaSessionToken: string;
  readonly expiresIn: number;
}

export type LoginResponseDto = AuthResponseDto | MfaChallengeResponseDto;
