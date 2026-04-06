/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Terminus health indicator that pings both Prisma clients with SELECT 1 and reports latency.
 */
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { PrismaClient } from '@prisma/client';

import { PRISMA_READ, PRISMA_WRITE } from './database.tokens';

const DEGRADED_LATENCY_THRESHOLD_MS = 500;

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(PRISMA_WRITE) private readonly writeClient: PrismaClient,
    @Inject(PRISMA_READ) private readonly readClient: PrismaClient,
  ) {
    super();
  }

  async checkWrite(key: string): Promise<HealthIndicatorResult> {
    return this.probe(key, this.writeClient, true);
  }

  async checkRead(key: string): Promise<HealthIndicatorResult> {
    return this.probe(key, this.readClient, false);
  }

  private async probe(
    key: string,
    client: PrismaClient,
    trackDegraded: boolean,
  ): Promise<HealthIndicatorResult> {
    const startedAt = Date.now();
    try {
      await client.$queryRaw`SELECT 1`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'query_failed';
      const downResult = this.getStatus(key, false, { error: message });
      throw new HealthCheckError(`${key} health check failed`, downResult);
    }
    const latencyMs = Date.now() - startedAt;
    const data = trackDegraded
      ? { latencyMs, degraded: latencyMs > DEGRADED_LATENCY_THRESHOLD_MS }
      : { latencyMs };
    return this.getStatus(key, true, data);
  }
}
