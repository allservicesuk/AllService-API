/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * JWT config namespace for RS256 keypair, TTLs, issuer, and audience claims.
 */
import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  readonly privateKey: string | null;
  readonly publicKey: string;
  readonly accessTtlSeconds: number;
  readonly refreshTtlSeconds: number;
  readonly issuer: string;
  readonly audience: string;
}

export default registerAs('jwt', (): JwtConfig => {
  const privateKey = process.env['JWT_PRIVATE_KEY'];
  return {
    privateKey: privateKey && privateKey.length > 0 ? privateKey : null,
    publicKey: process.env['JWT_PUBLIC_KEY'] ?? '',
    accessTtlSeconds: parseInt(process.env['JWT_ACCESS_TTL'] ?? '900', 10),
    refreshTtlSeconds: parseInt(process.env['JWT_REFRESH_TTL'] ?? '2592000', 10),
    issuer: process.env['JWT_ISSUER'] ?? 'allservices',
    audience: process.env['JWT_AUDIENCE'] ?? 'allservices-api',
  };
});
