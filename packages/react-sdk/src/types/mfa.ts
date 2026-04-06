/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * MFA setup and verification types.
 */

export interface MfaSetupResult {
  readonly secret: string;
  readonly qrCodeUrl: string;
  readonly recoveryCodes: readonly string[];
}
