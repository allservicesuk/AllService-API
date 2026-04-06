/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Pure mappers that strip secrets from Prisma User rows and serialise dates to ISO strings.
 */
import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import { UserResponseDto } from './dto/user-response.dto';
import type { UserSafe } from './interfaces/user-safe.interface';
import type { UserWithSecrets } from './interfaces/user-with-secrets.interface';

@Injectable()
export class UserMapper {
  toSafe(user: User): UserSafe {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      isActive: user.isActive,
      isLocked: user.isLocked,
      lockReason: user.lockReason,
      lockedUntil: user.lockedUntil,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      tenantId: user.tenantId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toWithSecrets(user: User): UserWithSecrets {
    return {
      ...this.toSafe(user),
      passwordHash: user.passwordHash,
      mfaSecret: user.mfaSecret,
      mfaRecoveryCodes: user.mfaRecoveryCodes,
      failedLoginAttempts: user.failedLoginAttempts,
      lastLoginIp: user.lastLoginIp,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  toSafeList(users: readonly User[]): UserSafe[] {
    return users.map((user) => this.toSafe(user));
  }

  toResponse(user: User | UserSafe): UserResponseDto {
    const safe: UserSafe = this.isPrismaUser(user) ? this.toSafe(user) : user;
    return {
      id: safe.id,
      email: safe.email,
      firstName: safe.firstName,
      lastName: safe.lastName,
      roles: safe.roles,
      isActive: safe.isActive,
      isLocked: safe.isLocked,
      lockReason: safe.lockReason,
      lockedUntil: safe.lockedUntil ? safe.lockedUntil.toISOString() : null,
      emailVerified: safe.emailVerified,
      mfaEnabled: safe.mfaEnabled,
      tenantId: safe.tenantId,
      lastLoginAt: safe.lastLoginAt ? safe.lastLoginAt.toISOString() : null,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
    };
  }

  toResponseList(users: readonly (User | UserSafe)[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }

  private isPrismaUser(user: User | UserSafe): user is User {
    return 'passwordHash' in user;
  }
}
