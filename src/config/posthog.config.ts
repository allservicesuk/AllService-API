/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * PostHog config namespace for analytics API key and EU-region host.
 */
import { registerAs } from '@nestjs/config';

export interface PostHogConfig {
  readonly apiKey: string | null;
  readonly host: string;
}

export default registerAs('posthog', (): PostHogConfig => {
  const apiKey = process.env['POSTHOG_API_KEY'];
  return {
    apiKey: apiKey && apiKey.length > 0 ? apiKey : null,
    host: process.env['POSTHOG_HOST'] ?? 'https://eu.posthog.com',
  };
});
