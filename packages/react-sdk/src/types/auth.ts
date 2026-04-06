/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Auth request and response types mirroring backend DTOs.
 */

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly mfaCode?: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly token: string;
  readonly newPassword: string;
}

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface VerifyEmailRequest {
  readonly token: string;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}

export interface EnableMfaRequest {
  readonly code: string;
}

export interface DisableMfaRequest {
  readonly password: string;
  readonly code: string;
}

export interface AuthResponseUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly roles: readonly string[];
  readonly emailVerified: boolean;
  readonly mfaEnabled: boolean;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
  readonly user: AuthResponseUser;
}

export interface MfaChallengeResponse {
  readonly mfaRequired: true;
  readonly mfaSessionToken: string;
  readonly expiresIn: number;
}

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export interface RefreshResponse {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresIn: number;
}

export interface SuccessResponse {
  readonly success: true;
}

export interface SuccessMessageResponse {
  readonly success: true;
  readonly message: string;
}

export function isMfaChallenge(
  response: LoginResponse,
): response is MfaChallengeResponse {
  return 'mfaRequired' in response && response.mfaRequired === true;
}
