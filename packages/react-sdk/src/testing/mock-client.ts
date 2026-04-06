/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Pre-configured mock AllServicesClient for unit tests.
 */
import { AllServicesClient } from '../core/http-client';
import type { ClientConfig } from '../core/http-client.types';

const DEFAULT_TEST_CONFIG: ClientConfig = {
  baseUrl: 'http://localhost:3000',
  region: 'eu',
  platform: 'web',
};

export function createMockClient(
  overrides?: Partial<ClientConfig>,
): AllServicesClient {
  return new AllServicesClient({
    ...DEFAULT_TEST_CONFIG,
    ...overrides,
  });
}
