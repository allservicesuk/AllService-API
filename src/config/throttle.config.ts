/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Throttle config namespace for global rate-limit TTL and limit.
 */
import { registerAs } from '@nestjs/config';

export interface ThrottleConfig {
  readonly globalTtlMs: number;
  readonly globalLimit: number;
}

export default registerAs(
  'throttle',
  (): ThrottleConfig => ({
    globalTtlMs: parseInt(process.env['THROTTLE_GLOBAL_TTL'] ?? '60000', 10),
    globalLimit: parseInt(process.env['THROTTLE_GLOBAL_LIMIT'] ?? '100', 10),
  }),
);
