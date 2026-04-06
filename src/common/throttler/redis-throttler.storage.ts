/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Redis-backed ThrottlerStorage implementation used across the cluster for global rate limiting.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '../../redis/redis.tokens';

const KEY_NAMESPACE = 'throttle';
const MS_PER_SECOND = 1_000;

interface ThrottlerStorageRecord {
  readonly totalHits: number;
  readonly timeToExpire: number;
  readonly isBlocked: boolean;
  readonly timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `${KEY_NAMESPACE}:${throttlerName}:${key}`;
    const blockKey = `${KEY_NAMESPACE}:${throttlerName}:${key}:blocked`;
    const blockTtl = await this.client.pttl(blockKey);
    if (blockTtl > 0) {
      const current = await this.client.get(hitKey);
      const totalHits = current === null ? limit + 1 : parseInt(current, 10);
      return {
        totalHits,
        timeToExpire: this.msToSeconds(blockTtl),
        isBlocked: true,
        timeToBlockExpire: this.msToSeconds(blockTtl),
      };
    }
    const totalHits = await this.client.incr(hitKey);
    if (totalHits === 1) {
      await this.client.pexpire(hitKey, ttl);
    }
    const remaining = await this.client.pttl(hitKey);
    const timeToExpire = this.msToSeconds(remaining > 0 ? remaining : ttl);
    if (totalHits > limit && blockDuration > 0) {
      await this.client.set(blockKey, String(totalHits), 'PX', blockDuration);
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: this.msToSeconds(blockDuration),
      };
    }
    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  private msToSeconds(milliseconds: number): number {
    return Math.ceil(milliseconds / MS_PER_SECOND);
  }
}
