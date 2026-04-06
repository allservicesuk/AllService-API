/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Terminus health indicator reporting Sentry and PostHog client enablement state.
 */
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

import { PostHogService } from '../observability/posthog.service';
import { SentryService } from '../observability/sentry.service';

@Injectable()
export class ObservabilityHealthIndicator extends HealthIndicator {
  constructor(
    private readonly sentry: SentryService,
    private readonly posthog: PostHogService,
  ) {
    super();
  }

  checkSentry(key: string): HealthIndicatorResult {
    const enabled = this.sentry.isEnabled();
    const result = this.getStatus(key, enabled, { enabled });
    if (!enabled) {
      throw new HealthCheckError(`${key} health check failed`, result);
    }
    return result;
  }

  checkPostHog(key: string): HealthIndicatorResult {
    const enabled = this.posthog.isEnabled();
    const result = this.getStatus(key, enabled, { enabled });
    if (!enabled) {
      throw new HealthCheckError(`${key} health check failed`, result);
    }
    return result;
  }
}
