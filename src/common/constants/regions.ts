/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Region and region-role enums plus per-region replica-lag thresholds.
 */
export const Region = {
  EU: 'eu',
  NA: 'na',
} as const;

export type RegionCode = (typeof Region)[keyof typeof Region];

export const RegionRole = {
  PRIMARY: 'primary',
  REPLICA: 'replica',
} as const;

export type RegionRoleCode = (typeof RegionRole)[keyof typeof RegionRole];

export interface RegionProfile {
  readonly region: RegionCode;
  readonly role: RegionRoleCode;
  readonly isWriteCapable: boolean;
  readonly isPrimaryRegion: boolean;
  readonly hasLocalReadReplica: boolean;
  readonly replicaLag: {
    readonly warningMs: number;
    readonly criticalMs: number;
  };
}

export const REGION_CONFIGS: Record<RegionCode, RegionProfile> = {
  [Region.EU]: {
    region: Region.EU,
    role: RegionRole.PRIMARY,
    isWriteCapable: true,
    isPrimaryRegion: true,
    hasLocalReadReplica: false,
    replicaLag: { warningMs: 1000, criticalMs: 5000 },
  },
  [Region.NA]: {
    region: Region.NA,
    role: RegionRole.REPLICA,
    isWriteCapable: true,
    isPrimaryRegion: false,
    hasLocalReadReplica: true,
    replicaLag: { warningMs: 1000, criticalMs: 5000 },
  },
} as const;
