/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Binary-safe Redis store for per-session AES-256-GCM keys used by the encrypted-session interceptor.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { RedisKeys } from '@common/constants';
import regionConfig from '@config/region.config';

import { RedisService } from '../redis/redis.service';

const SESSION_KEY_BYTES = 32;

@Injectable()
export class KeyStoreService {
  constructor(
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly redis: RedisService,
  ) {}

  async store(sessionId: string, key: Buffer, ttlSeconds: number): Promise<void> {
    if (key.length !== SESSION_KEY_BYTES) {
      throw new Error(`KeyStoreService.store: key must be ${SESSION_KEY_BYTES} bytes`);
    }
    await this.redis.set(this.keyFor(sessionId), key.toString('base64'), ttlSeconds);
  }

  async retrieve(sessionId: string): Promise<Buffer | null> {
    const encoded = await this.redis.get(this.keyFor(sessionId));
    if (encoded === null) {
      return null;
    }
    const buffer = Buffer.from(encoded, 'base64');
    return buffer.length === SESSION_KEY_BYTES ? buffer : null;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.redis.del(this.keyFor(sessionId));
  }

  async extend(sessionId: string, ttlSeconds: number): Promise<boolean> {
    return this.redis.expire(this.keyFor(sessionId), ttlSeconds);
  }

  private keyFor(sessionId: string): string {
    return RedisKeys.cryptoSession(this.region.region, sessionId);
  }
}
