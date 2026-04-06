/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Exposes /health liveness, /health/ready readiness, and /health/deep diagnostic endpoints.
 */
import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';

import { Role } from '@common/constants';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { PrismaHealthIndicator } from '@database/prisma.health';

import { RedisHealthIndicator } from '../redis/redis.health';
import { RegionHealthIndicator } from '../region/region.health';
import { RegionService } from '../region/region.service';

import { ConnectionsHealthIndicator } from './connections.health';
import { ObservabilityHealthIndicator } from './observability.health';

const HEAP_THRESHOLD_BYTES = 512 * 1024 * 1024;
const RSS_THRESHOLD_BYTES = 1024 * 1024 * 1024;
const DISK_THRESHOLD_PERCENT = 0.9;
const DISK_PATH = '/';

export interface LivenessResponse {
  readonly status: 'ok';
  readonly region: string;
  readonly role: string;
  readonly timestamp: string;
  readonly writable: boolean;
}

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly regionHealth: RegionHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly observabilityHealth: ObservabilityHealthIndicator,
    private readonly connections: ConnectionsHealthIndicator,
    private readonly region: RegionService,
  ) {}

  @Get()
  @Public()
  live(): LivenessResponse {
    return {
      status: 'ok',
      region: this.region.getRegion(),
      role: this.region.getRole(),
      timestamp: new Date().toISOString(),
      writable: this.region.isWriteAvailable(),
    };
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.checkWrite('database.write'),
      () => this.prismaHealth.checkRead('database.read'),
      () => this.redisHealth.check('redis'),
      () => this.regionHealth.check('region'),
    ]);
  }

  @Get('deep')
  @Roles(Role.ADMIN)
  @HealthCheck()
  deep(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.checkWrite('database.write'),
      () => this.prismaHealth.checkRead('database.read'),
      () => this.redisHealth.check('redis'),
      () => this.regionHealth.check('region'),
      () => this.memory.checkHeap('memory.heap', HEAP_THRESHOLD_BYTES),
      () => this.memory.checkRSS('memory.rss', RSS_THRESHOLD_BYTES),
      () =>
        this.disk.checkStorage('disk.storage', {
          thresholdPercent: DISK_THRESHOLD_PERCENT,
          path: DISK_PATH,
        }),
      () => this.connections.check('database.connections'),
      () => this.observabilityHealth.checkSentry('sentry'),
      () => this.observabilityHealth.checkPostHog('posthog'),
    ]);
  }
}
