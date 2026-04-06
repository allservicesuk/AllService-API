/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * CORS config namespace exposing the allowed-origins list parsed from a comma-delimited env var.
 */
import { registerAs } from '@nestjs/config';

export interface CorsConfig {
  readonly allowedOrigins: readonly string[];
}

export default registerAs(
  'cors',
  (): CorsConfig => ({
    allowedOrigins: (process.env['ALLOWED_ORIGINS'] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  }),
);
