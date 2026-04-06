/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * User request and response types mirroring backend DTOs.
 */

export interface UserResponse {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly lockReason: string | null;
  readonly lockedUntil: string | null;
  readonly emailVerified: boolean;
  readonly mfaEnabled: boolean;
  readonly tenantId: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateProfileRequest {
  readonly firstName?: string;
  readonly lastName?: string;
}

export interface ListUsersParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly role?: string;
  readonly isActive?: boolean;
  readonly isLocked?: boolean;
  readonly tenantId?: string;
  readonly includeDeleted?: boolean;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'lastLoginAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface AdminCreateUserRequest {
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles: readonly string[];
  readonly tenantId?: string;
  readonly emailVerified?: boolean;
}

export interface AdminUpdateUserRequest {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: readonly string[];
  readonly isActive?: boolean;
  readonly tenantId?: string;
  readonly emailVerified?: boolean;
}

export interface LockUserRequest {
  readonly reason: string;
  readonly durationMinutes?: number;
}

export interface ListUsersResult {
  readonly items: readonly UserResponse[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
