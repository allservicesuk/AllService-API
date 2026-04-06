/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Factory provider for the dedicated ioredis client used by BullMQ queues, workers, and events.
 */
import type { FactoryProvider } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';

import redisConfig from '@config/redis.config';

import { BULL_CONNECTION } from './queue.tokens';

const RETRY_STEP_MS = 100;
const RETRY_MAX_MS = 5_000;

export const bullConnectionProvider: FactoryProvider<Redis> = {
  provide: BULL_CONNECTION,
  useFactory: (config: ConfigType<typeof redisConfig>): Redis => {
    const options: RedisOptions = {
      keyPrefix: '',
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number): number => Math.min(times * RETRY_STEP_MS, RETRY_MAX_MS),
      lazyConnect: false,
      ...(config.tls ? { tls: {} } : {}),
    };
    return new Redis(config.url, options);
  },
  inject: [redisConfig.KEY],
};
