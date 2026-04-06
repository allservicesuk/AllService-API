/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Terminus health indicator reporting active Postgres connections via pg_stat_activity.
 */
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { PrismaClient } from '@prisma/client';

import { PRISMA_WRITE } from '@database/database.tokens';

const DEFAULT_ACTIVE_CONNECTION_THRESHOLD = 80;

@Injectable()
export class ConnectionsHealthIndicator extends HealthIndicator {
  constructor(@Inject(PRISMA_WRITE) private readonly writeClient: PrismaClient) {
    super();
  }

  async check(
    key: string,
    threshold: number = DEFAULT_ACTIVE_CONNECTION_THRESHOLD,
  ): Promise<HealthIndicatorResult> {
    let active: number;
    try {
      const rows = await this.writeClient.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM pg_stat_activity
        WHERE state = 'active' AND datname = current_database()
      `;
      const first = rows[0];
      active = first ? Number(first.count) : 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'query_failed';
      const downResult = this.getStatus(key, false, { error: message });
      throw new HealthCheckError(`${key} health check failed`, downResult);
    }
    const healthy = active < threshold;
    const data = { active, threshold };
    if (!healthy) {
      const downResult = this.getStatus(key, false, data);
      throw new HealthCheckError(`${key} health check failed`, downResult);
    }
    return this.getStatus(key, true, data);
  }
}
