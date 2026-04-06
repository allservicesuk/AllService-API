/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global Redis module that builds an ioredis client with retry strategy, TLS, and empty keyPrefix.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';

import redisConfig from '@config/redis.config';

import { RedisHealthIndicator } from './redis.health';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.tokens';

const RETRY_STEP_MS = 50;
const RETRY_MAX_MS = 2000;

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigType<typeof redisConfig>): Redis => {
        const options: RedisOptions = {
          keyPrefix: '',
          maxRetriesPerRequest: config.maxRetries,
          retryStrategy: (times: number): number => Math.min(times * RETRY_STEP_MS, RETRY_MAX_MS),
          enableReadyCheck: true,
          lazyConnect: false,
          ...(config.tls ? { tls: {} } : {}),
        };
        return new Redis(config.url, options);
      },
      inject: [redisConfig.KEY],
    },
    RedisService,
    RedisHealthIndicator,
  ],
  exports: [REDIS_CLIENT, RedisService, RedisHealthIndicator],
})
export class RedisModule {}
