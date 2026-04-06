/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * UserSafe augmented with credential secrets used only by Auth for verification and MFA flows.
 */
import type { UserSafe } from './user-safe.interface';

export interface UserWithSecrets extends UserSafe {
  readonly passwordHash: string;
  readonly mfaSecret: string | null;
  readonly mfaRecoveryCodes: readonly string[];
  readonly failedLoginAttempts: number;
  readonly lastLoginIp: string | null;
  readonly passwordChangedAt: Date | null;
}
