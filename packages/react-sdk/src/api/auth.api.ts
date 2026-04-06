/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Auth API module covering registration, login, refresh, MFA, sessions, and password flows.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type {
  AuthResponse,
  ChangePasswordRequest,
  DisableMfaRequest,
  EnableMfaRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SuccessMessageResponse,
  SuccessResponse,
  VerifyEmailRequest,
} from '../types/auth';
import type { MfaSetupResult } from '../types/mfa';
import type { SessionInfo } from '../types/sessions';

const BASE = '/v1/auth';

export class AuthApi {
  constructor(private readonly client: AllServicesClient) {}

  async register(
    data: RegisterRequest,
    options?: RequestOptions,
  ): Promise<AuthResponse> {
    return this.client.request<AuthResponse>('POST', `${BASE}/register`, {
      ...options,
      body: data,
      skipAuth: true,
    });
  }

  async login(
    data: LoginRequest,
    options?: RequestOptions,
  ): Promise<LoginResponse> {
    return this.client.request<LoginResponse>('POST', `${BASE}/login`, {
      ...options,
      body: data,
      skipAuth: true,
    });
  }

  async refresh(options?: RequestOptions): Promise<RefreshResponse> {
    return this.client.request<RefreshResponse>('POST', `${BASE}/refresh`, {
      ...options,
      skipAuth: true,
    });
  }

  async logout(options?: RequestOptions): Promise<void> {
    return this.client.request<void>('POST', `${BASE}/logout`, options);
  }

  async logoutAll(options?: RequestOptions): Promise<void> {
    return this.client.request<void>('POST', `${BASE}/logout-all`, options);
  }

  async verifyEmail(
    data: VerifyEmailRequest,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.client.request<SuccessResponse>('POST', `${BASE}/verify-email`, {
      ...options,
      body: data,
      skipAuth: true,
    });
  }

  async forgotPassword(
    data: ForgotPasswordRequest,
    options?: RequestOptions,
  ): Promise<SuccessMessageResponse> {
    return this.client.request<SuccessMessageResponse>(
      'POST',
      `${BASE}/forgot-password`,
      { ...options, body: data, skipAuth: true },
    );
  }

  async resetPassword(
    data: ResetPasswordRequest,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.client.request<SuccessResponse>('POST', `${BASE}/reset-password`, {
      ...options,
      body: data,
      skipAuth: true,
    });
  }

  async changePassword(
    data: ChangePasswordRequest,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.client.request<SuccessResponse>('POST', `${BASE}/change-password`, {
      ...options,
      body: data,
    });
  }

  async getSessions(options?: RequestOptions): Promise<readonly SessionInfo[]> {
    return this.client.request<readonly SessionInfo[]>('GET', `${BASE}/sessions`, options);
  }

  async revokeSession(
    sessionId: string,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request<void>(
      'DELETE',
      `${BASE}/sessions/${encodeURIComponent(sessionId)}`,
      options,
    );
  }

  async setupMfa(options?: RequestOptions): Promise<MfaSetupResult> {
    return this.client.request<MfaSetupResult>('POST', `${BASE}/mfa/setup`, options);
  }

  async verifyMfaSetup(
    data: EnableMfaRequest,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.client.request<SuccessResponse>('POST', `${BASE}/mfa/verify-setup`, {
      ...options,
      body: data,
    });
  }

  async disableMfa(
    data: DisableMfaRequest,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.client.request<SuccessResponse>('POST', `${BASE}/mfa/disable`, {
      ...options,
      body: data,
    });
  }
}
