/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * App-level config namespace exposing NODE_ENV, port, and API version as typed values.
 */
import { registerAs } from '@nestjs/config';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'staging' | 'production';
  readonly port: number;
  readonly apiVersion: string;
  readonly logLevel: LogLevel;
  readonly auditAsyncEnabled: boolean;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly isTest: boolean;
}

export default registerAs('app', (): AppConfig => {
  const nodeEnv = (process.env['NODE_ENV'] ?? 'development') as AppConfig['nodeEnv'];
  return {
    nodeEnv,
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    apiVersion: process.env['API_VERSION'] ?? '1',
    logLevel: (process.env['LOG_LEVEL'] ?? 'info') as LogLevel,
    auditAsyncEnabled: process.env['AUDIT_ASYNC_ENABLED'] === 'true',
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
  };
});
