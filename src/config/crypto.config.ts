/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Crypto config namespace for at-rest encryption master keys and ECDH session TTL.
 */
import { registerAs } from '@nestjs/config';

export type CryptoKeyVersion = 'v1' | 'v2';

export interface CryptoConfig {
  readonly enabled: boolean;
  readonly masterKeyV1: string;
  readonly masterKeyV2: string | null;
  readonly activeVersion: CryptoKeyVersion;
  readonly sessionTtlSeconds: number;
}

export default registerAs('crypto', (): CryptoConfig => {
  const v2 = process.env['CRYPTO_MASTER_KEY_V2'];
  return {
    enabled: process.env['CRYPTO_ENABLED'] !== 'false',
    masterKeyV1: process.env['CRYPTO_MASTER_KEY'] ?? '',
    masterKeyV2: v2 && v2.length > 0 ? v2 : null,
    activeVersion: (process.env['CRYPTO_ACTIVE_VERSION'] ?? 'v1') as CryptoKeyVersion,
    sessionTtlSeconds: parseInt(process.env['CRYPTO_SESSION_TTL'] ?? '3600', 10),
  };
});
