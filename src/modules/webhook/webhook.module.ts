/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Webhook module that registers the endpoint CRUD service, delivery pipeline, signing, and circuit breaker.
 */
import { Module } from '@nestjs/common';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookSigningService } from './webhook-signing.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookCircuitBreakerService } from './webhook-circuit-breaker.service';
import { WebhookEventsListener } from './webhook-events.listener';
import { WebhookMapper } from './webhook.mapper';

@Module({
  controllers: [WebhookController],
  providers: [
    WebhookService,
    WebhookSigningService,
    WebhookDeliveryService,
    WebhookCircuitBreakerService,
    WebhookEventsListener,
    WebhookMapper,
  ],
  exports: [WebhookService, WebhookCircuitBreakerService],
})
export class WebhookModule {}
