/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Database config namespace for Prisma read and write connection pools.
 */
import { registerAs } from '@nestjs/config';

export interface DatabasePoolConfig {
  readonly url: string;
  readonly poolMin: number;
  readonly poolMax: number;
}

export interface DatabaseConfig {
  readonly write: DatabasePoolConfig;
  readonly read: DatabasePoolConfig;
  readonly ssl: boolean;
  readonly statementTimeout: number;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    write: {
      url: process.env['DATABASE_WRITE_URL'] ?? '',
      poolMin: parseInt(process.env['DATABASE_WRITE_POOL_MIN'] ?? '2', 10),
      poolMax: parseInt(process.env['DATABASE_WRITE_POOL_MAX'] ?? '25', 10),
    },
    read: {
      url: process.env['DATABASE_READ_URL'] ?? '',
      poolMin: parseInt(process.env['DATABASE_READ_POOL_MIN'] ?? '2', 10),
      poolMax: parseInt(process.env['DATABASE_READ_POOL_MAX'] ?? '25', 10),
    },
    ssl: process.env['DATABASE_SSL'] === 'true',
    statementTimeout: parseInt(process.env['DATABASE_STATEMENT_TIMEOUT'] ?? '30000', 10),
  }),
);
