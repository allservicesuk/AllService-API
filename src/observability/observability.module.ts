/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global observability module exporting Sentry, PostHog, and Prometheus metrics services.
 */
import { Global, Module } from '@nestjs/common';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PostHogService } from './posthog.service';
import { SentryService } from './sentry.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [SentryService, PostHogService, MetricsService],
  exports: [SentryService, PostHogService, MetricsService],
})
export class ObservabilityModule {}
