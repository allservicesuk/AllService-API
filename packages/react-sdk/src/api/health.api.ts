/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Health and readiness check API.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type { HealthResponse, ReadinessResponse } from '../types/health';

export class HealthApi {
  constructor(private readonly client: AllServicesClient) {}

  async check(options?: RequestOptions): Promise<HealthResponse> {
    return this.client.request<HealthResponse>('GET', '/v1/health', {
      ...options,
      skipAuth: true,
    });
  }

  async ready(options?: RequestOptions): Promise<ReadinessResponse> {
    return this.client.request<ReadinessResponse>('GET', '/v1/health/ready', {
      ...options,
      skipAuth: true,
    });
  }
}
