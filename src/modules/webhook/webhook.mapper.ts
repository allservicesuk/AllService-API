/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Maps Prisma webhook models to API response DTOs.
 */
import { Injectable } from '@nestjs/common';
import type { WebhookDelivery, WebhookEndpoint, WebhookEvent } from '@prisma/client';

import type {
  WebhookDeliveryResponseDto,
  WebhookEndpointResponseDto,
  WebhookEventResponseDto,
} from './dto/webhook-endpoint-response.dto';

type EventWithDeliveries = WebhookEvent & { deliveries?: WebhookDelivery[] };

@Injectable()
export class WebhookMapper {
  toEndpointResponse(
    endpoint: WebhookEndpoint,
    includeSecret?: string,
  ): WebhookEndpointResponseDto {
    return {
      id: endpoint.id,
      url: endpoint.url,
      description: endpoint.description,
      eventTypes: endpoint.eventTypes,
      status: endpoint.status,
      metadata: endpoint.metadata,
      createdBy: endpoint.createdBy,
      failureCount: endpoint.failureCount,
      lastFailedAt: endpoint.lastFailedAt?.toISOString() ?? null,
      circuitState: endpoint.circuitState,
      createdAt: endpoint.createdAt.toISOString(),
      updatedAt: endpoint.updatedAt.toISOString(),
      ...(includeSecret !== undefined ? { secret: includeSecret } : {}),
    };
  }

  toEndpointResponseList(endpoints: readonly WebhookEndpoint[]): WebhookEndpointResponseDto[] {
    return endpoints.map((e) => this.toEndpointResponse(e));
  }

  toDeliveryResponse(delivery: WebhookDelivery): WebhookDeliveryResponseDto {
    return {
      id: delivery.id,
      eventId: delivery.eventId,
      attemptNumber: delivery.attemptNumber,
      status: delivery.status,
      httpStatusCode: delivery.httpStatusCode,
      latencyMs: delivery.latencyMs,
      errorMessage: delivery.errorMessage,
      nextRetryAt: delivery.nextRetryAt?.toISOString() ?? null,
      createdAt: delivery.createdAt.toISOString(),
    };
  }

  toDeliveryResponseList(deliveries: readonly WebhookDelivery[]): WebhookDeliveryResponseDto[] {
    return deliveries.map((d) => this.toDeliveryResponse(d));
  }

  toEventResponse(event: EventWithDeliveries): WebhookEventResponseDto {
    return {
      id: event.id,
      endpointId: event.endpointId,
      eventType: event.eventType,
      payload: event.payload,
      idempotencyKey: event.idempotencyKey,
      createdAt: event.createdAt.toISOString(),
      ...(event.deliveries
        ? { deliveries: this.toDeliveryResponseList(event.deliveries) }
        : {}),
    };
  }
}
