/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Region service that polls write-DB connectivity and replica lag on a 10s interval.
 */
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';

import { REGION_CONFIGS, RedisKeys, type RegionProfile } from '@common/constants';
import regionConfig from '@config/region.config';
import { PRISMA_READ, PRISMA_WRITE } from '@database/database.tokens';

import { RedisService } from '../redis/redis.service';

const PROBE_INTERVAL_MS = 10_000;
const MAX_CONSECUTIVE_FAILURES = 3;
const REPLICA_LAG_TTL_SECONDS = 60;

@Injectable()
export class RegionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RegionService.name);
  private readonly profile: RegionProfile;
  private writeAvailable = true;
  private consecutiveFailures = 0;
  private lastReplicaLagMs: number | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    @Inject(regionConfig.KEY) private readonly config: ConfigType<typeof regionConfig>,
    @Inject(PRISMA_WRITE) private readonly writeClient: PrismaClient,
    @Inject(PRISMA_READ) private readonly readClient: PrismaClient,
    private readonly redis: RedisService,
  ) {
    const profile = REGION_CONFIGS[this.config.region];
    if (!profile) {
      throw new Error(`Unknown region: ${this.config.region}`);
    }
    this.profile = profile;
  }

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => {
      void this.runProbe();
    }, PROBE_INTERVAL_MS);
    this.logger.log(
      `Region probe started (region=${this.config.region}, role=${this.config.role})`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getRegion(): string {
    return this.config.region;
  }

  getRole(): string {
    return this.config.role;
  }

  isPrimary(): boolean {
    return this.config.isPrimary;
  }

  isReplica(): boolean {
    return this.config.isReplica;
  }

  isWriteCapable(): boolean {
    return this.config.isWriteCapable;
  }

  isWriteAvailable(): boolean {
    return this.writeAvailable;
  }

  getReplicaLagMs(): number | null {
    return this.lastReplicaLagMs;
  }

  getProfile(): RegionProfile {
    return this.profile;
  }

  private async runProbe(): Promise<void> {
    await this.probeWriteDb();
    if (this.profile.hasLocalReadReplica) {
      await this.probeReplicaLag();
    }
  }

  private async probeWriteDb(): Promise<void> {
    try {
      await this.writeClient.$queryRaw`SELECT 1`;
      if (this.consecutiveFailures > 0) {
        this.logger.log('Write DB recovered');
      }
      this.consecutiveFailures = 0;
      if (!this.writeAvailable) {
        this.writeAvailable = true;
        this.logger.log('Write DB marked available');
      }
    } catch (error) {
      this.consecutiveFailures += 1;
      const message = error instanceof Error ? error.message : 'probe_failed';
      this.logger.warn(`Write DB probe failed (count=${this.consecutiveFailures}): ${message}`);
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && this.writeAvailable) {
        this.writeAvailable = false;
        this.logger.error('Write DB marked unavailable after 3 consecutive failures');
      }
    }
  }

  private async probeReplicaLag(): Promise<void> {
    try {
      const rows = await this.readClient.$queryRaw<Array<{ lag_ms: number | null }>>`
        SELECT (EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000)::float8 AS lag_ms
      `;
      const row = rows[0];
      const lag = row?.lag_ms ?? 0;
      this.lastReplicaLagMs = lag;
      await this.redis.set(
        RedisKeys.replicaLag(this.config.region),
        String(lag),
        REPLICA_LAG_TTL_SECONDS,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'probe_failed';
      this.logger.warn(`Replica lag probe failed: ${message}`);
    }
  }
}
