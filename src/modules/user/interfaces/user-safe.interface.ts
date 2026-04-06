/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Non-secret user shape returned from every public UserService method and attached to req.user.
 */
export interface UserSafe {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly lockReason: string | null;
  readonly lockedUntil: Date | null;
  readonly emailVerified: boolean;
  readonly mfaEnabled: boolean;
  readonly tenantId: string | null;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
