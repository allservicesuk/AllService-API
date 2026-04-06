/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Terminus health indicator reporting region writability and replica-lag status.
 */
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

import { RegionService } from './region.service';

type LagStatus = 'ok' | 'warning' | 'critical';

@Injectable()
export class RegionHealthIndicator extends HealthIndicator {
  constructor(private readonly region: RegionService) {
    super();
  }

  check(key: string): HealthIndicatorResult {
    const profile = this.region.getProfile();
    const writable = this.region.isWriteAvailable();
    const lagMs = this.region.getReplicaLagMs();
    const data: Record<string, unknown> = {
      region: this.region.getRegion(),
      role: this.region.getRole(),
      writable,
    };
    if (lagMs !== null) {
      data['replicaLagMs'] = lagMs;
      data['lagStatus'] = this.classifyLag(lagMs, profile.replicaLag);
    }
    const criticalLag = lagMs !== null && lagMs > profile.replicaLag.criticalMs;
    if (criticalLag) {
      const downResult = this.getStatus(key, false, data);
      throw new HealthCheckError(`${key} health check failed`, downResult);
    }
    return this.getStatus(key, true, data);
  }

  private classifyLag(
    lagMs: number,
    thresholds: { warningMs: number; criticalMs: number },
  ): LagStatus {
    if (lagMs > thresholds.criticalMs) {
      return 'critical';
    }
    if (lagMs > thresholds.warningMs) {
      return 'warning';
    }
    return 'ok';
  }
}
