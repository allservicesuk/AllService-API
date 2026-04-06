/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Terminus health indicator that pings Redis and reports latency.
 */
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from './redis.tokens';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {
    super();
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    const startedAt = Date.now();
    try {
      await this.client.ping();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ping_failed';
      const downResult = this.getStatus(key, false, { error: message });
      throw new HealthCheckError(`${key} health check failed`, downResult);
    }
    const latencyMs = Date.now() - startedAt;
    return this.getStatus(key, true, { latencyMs });
  }
}
