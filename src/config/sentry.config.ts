/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Sentry config namespace for DSN, environment, sample rate, and region tag.
 */
import { registerAs } from '@nestjs/config';

export interface SentryConfig {
  readonly dsn: string | null;
  readonly environment: string;
  readonly tracesSampleRate: number;
  readonly region: 'eu' | 'na';
}

export default registerAs('sentry', (): SentryConfig => {
  const dsn = process.env['SENTRY_DSN'];
  return {
    dsn: dsn && dsn.length > 0 ? dsn : null,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
    tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
    region: (process.env['SENTRY_REGION'] ?? 'eu') as 'eu' | 'na',
  };
});
