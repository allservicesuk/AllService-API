/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Region config namespace exposing region, role, and derived flags for write-capability routing.
 */
import { registerAs } from '@nestjs/config';

export type Region = 'eu' | 'na';
export type RegionRole = 'primary' | 'replica';

export interface RegionConfig {
  readonly region: Region;
  readonly role: RegionRole;
  readonly primaryApiUrl: string | null;
  readonly internalApiSecret: string;
  readonly isPrimary: boolean;
  readonly isReplica: boolean;
  readonly isWriteCapable: boolean;
}

export default registerAs('region', (): RegionConfig => {
  const region = process.env['REGION'] as Region;
  const role = process.env['REGION_ROLE'] as RegionRole;
  const primaryApiUrl = process.env['PRIMARY_API_URL'];
  return {
    region,
    role,
    primaryApiUrl: primaryApiUrl && primaryApiUrl.length > 0 ? primaryApiUrl : null,
    internalApiSecret: process.env['INTERNAL_API_SECRET'] ?? '',
    isPrimary: role === 'primary',
    isReplica: role === 'replica',
    isWriteCapable: role === 'primary',
  };
});
