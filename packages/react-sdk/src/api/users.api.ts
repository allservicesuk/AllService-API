/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Users API module covering self-service profile and admin user management.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  ListUsersParams,
  ListUsersResult,
  LockUserRequest,
  UpdateProfileRequest,
  UserResponse,
} from '../types/users';

const BASE = '/v1/users';

function toQueryString(params: Record<string, unknown>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

export class UsersApi {
  constructor(private readonly client: AllServicesClient) {}

  async getMe(options?: RequestOptions): Promise<UserResponse> {
    return this.client.request<UserResponse>('GET', `${BASE}/me`, options);
  }

  async updateMe(
    data: UpdateProfileRequest,
    options?: RequestOptions,
  ): Promise<UserResponse> {
    return this.client.request<UserResponse>('PATCH', `${BASE}/me`, {
      ...options,
      body: data,
    });
  }

  async deleteMe(options?: RequestOptions): Promise<void> {
    return this.client.request<void>('DELETE', `${BASE}/me`, options);
  }

  async getUser(
    id: string,
    options?: RequestOptions,
  ): Promise<UserResponse> {
    return this.client.request<UserResponse>(
      'GET',
      `${BASE}/${encodeURIComponent(id)}`,
      options,
    );
  }

  async listUsers(
    params: ListUsersParams = {},
    options?: RequestOptions,
  ): Promise<ListUsersResult> {
    const qs = toQueryString(params as Record<string, unknown>);
    return this.client.request<ListUsersResult>('GET', `${BASE}${qs}`, options);
  }

  async createUser(
    data: AdminCreateUserRequest,
    options?: RequestOptions,
  ): Promise<UserResponse> {
    return this.client.request<UserResponse>('POST', BASE, {
      ...options,
      body: data,
    });
  }

  async updateUser(
    id: string,
    data: AdminUpdateUserRequest,
    options?: RequestOptions,
  ): Promise<UserResponse> {
    return this.client.request<UserResponse>(
      'PATCH',
      `${BASE}/${encodeURIComponent(id)}`,
      { ...options, body: data },
    );
  }

  async deleteUser(
    id: string,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request<void>(
      'DELETE',
      `${BASE}/${encodeURIComponent(id)}`,
      options,
    );
  }

  async restoreUser(
    id: string,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request<void>(
      'POST',
      `${BASE}/${encodeURIComponent(id)}/restore`,
      options,
    );
  }

  async lockUser(
    id: string,
    data: LockUserRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request<void>(
      'POST',
      `${BASE}/${encodeURIComponent(id)}/lock`,
      { ...options, body: data },
    );
  }

  async unlockUser(
    id: string,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request<void>(
      'POST',
      `${BASE}/${encodeURIComponent(id)}/unlock`,
      options,
    );
  }
}
