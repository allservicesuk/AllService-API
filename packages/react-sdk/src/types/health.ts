/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Health and readiness check response types.
 */

export interface HealthResponse {
  readonly status: string;
  readonly uptime: number;
  readonly timestamp: string;
}

export interface ReadinessResponse {
  readonly status: string;
  readonly checks: Record<string, { readonly status: string; readonly message?: string }>;
}
