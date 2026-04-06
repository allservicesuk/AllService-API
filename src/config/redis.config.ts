/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Redis config namespace for ioredis connection and key prefixing.
 */
import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  readonly url: string;
  readonly tls: boolean;
  readonly keyPrefix: string;
  readonly maxRetries: number;
}

export default registerAs(
  'redis',
  (): RedisConfig => ({
    url: process.env['REDIS_URL'] ?? '',
    tls: process.env['REDIS_TLS'] === 'true',
    keyPrefix: process.env['REDIS_KEY_PREFIX'] ?? 'as:eu:',
    maxRetries: parseInt(process.env['REDIS_MAX_RETRIES'] ?? '3', 10),
  }),
);
