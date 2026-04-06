/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Builds Postgres connection URLs with pool, statement-timeout, and SSL parameters attached.
 */
import type { DatabasePoolConfig } from '@config/database.config';

export function buildPrismaConnectionUrl(
  pool: DatabasePoolConfig,
  ssl: boolean,
  statementTimeoutMs: number,
): string {
  const url = new URL(pool.url);
  url.searchParams.set('connection_limit', String(pool.poolMax));
  url.searchParams.set('options', `-c statement_timeout=${statementTimeoutMs}`);
  if (ssl) {
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}
