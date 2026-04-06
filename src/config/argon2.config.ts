/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Argon2id config namespace for password hashing cost parameters.
 */
import { registerAs } from '@nestjs/config';

export interface Argon2Config {
  readonly memoryCost: number;
  readonly timeCost: number;
  readonly parallelism: number;
}

export default registerAs(
  'argon2',
  (): Argon2Config => ({
    memoryCost: parseInt(process.env['ARGON2_MEMORY_COST'] ?? '65536', 10),
    timeCost: parseInt(process.env['ARGON2_TIME_COST'] ?? '3', 10),
    parallelism: parseInt(process.env['ARGON2_PARALLELISM'] ?? '4', 10),
  }),
);
