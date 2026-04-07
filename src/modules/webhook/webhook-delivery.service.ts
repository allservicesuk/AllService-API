/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Executes webhook HTTP delivery with timeout, records result, and manages circuit breaker state.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { WebhookEndpoint, WebhookEvent } from '@prisma/client';

import webhookConfig from '@config/webhook.config';

import { WebhookCircuitBreakerService } from './webhook-circuit-breaker.service';
import { WebhookSigningService } from './webhook-signing.service';
import { WebhookService } from './webhook.service';
import {
  CircuitState,
  type CircuitStateCode,
  WEBHOOK_EVENT_ID_HEADER,
  WEBHOOK_EVENT_TYPE_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from './webhook.constants';

const RESPONSE_BODY_MAX_LENGTH = 4096;

export interface DeliveryResult {
  readonly success: boolean;
  readonly deliveryId: string;
  readonly httpStatusCode: number | null;
  readonly latencyMs: number;
  readonly errorMessage: string | null;
}

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    @Inject(webhookConfig.KEY) private readonly config: ConfigType<typeof webhookConfig>,
    private readonly webhookService: WebhookService,
    private readonly signingService: WebhookSigningService,
    private readonly circuitBreaker: WebhookCircuitBreakerService,
  ) {}

  async deliver(
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    attemptNumber: number,
  ): Promise<DeliveryResult> {
    const delivery = await this.webhookService.createDelivery(event.id, attemptNumber);
    const payloadString = JSON.stringify(event.payload);
    const { signature, timestamp } = this.signingService.sign(payloadString, endpoint.secret);
    const startedAt = process.hrtime.bigint();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AllServices-Webhook/1.0',
      [WEBHOOK_SIGNATURE_HEADER]: signature,
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
      [WEBHOOK_EVENT_ID_HEADER]: event.id,
      [WEBHOOK_EVENT_TYPE_HEADER]: event.eventType,
    };

    const requestHeaders = { ...headers };
    delete requestHeaders[WEBHOOK_SIGNATURE_HEADER];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.deliveryTimeoutMs,
      );

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latencyMs = this.elapsedMs(startedAt);
      const responseBody = await this.readResponseBody(response);
      const success = response.ok;

      await this.webhookService.updateDelivery(delivery.id, {
        status: success ? 'SUCCESS' : 'FAILED',
        httpStatusCode: response.status,
        requestHeaders,
        responseBody,
        latencyMs,
        errorMessage: success ? null : `HTTP ${response.status}`,
      });

      if (success) {
        await this.circuitBreaker.recordSuccess(endpoint.id);
      } else {
        await this.handleFailure(endpoint);
      }

      this.logger.log(
        `webhook.delivery.${success ? 'success' : 'failed'} endpointId=${endpoint.id} eventId=${event.id} attempt=${attemptNumber} status=${response.status} latencyMs=${latencyMs}`,
      );

      return {
        success,
        deliveryId: delivery.id,
        httpStatusCode: response.status,
        latencyMs,
        errorMessage: success ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      const latencyMs = this.elapsedMs(startedAt);
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      const isTimeout = error instanceof Error && error.name === 'AbortError';

      await this.webhookService.updateDelivery(delivery.id, {
        status: 'FAILED',
        httpStatusCode: null,
        requestHeaders,
        responseBody: null,
        latencyMs,
        errorMessage: isTimeout ? 'Request timed out' : errorMessage,
      });

      await this.handleFailure(endpoint);

      this.logger.warn(
        `webhook.delivery.error endpointId=${endpoint.id} eventId=${event.id} attempt=${attemptNumber} reason=${isTimeout ? 'timeout' : errorMessage} latencyMs=${latencyMs}`,
      );

      return {
        success: false,
        deliveryId: delivery.id,
        httpStatusCode: null,
        latencyMs,
        errorMessage: isTimeout ? 'Request timed out' : errorMessage,
      };
    }
  }

  calculateRetryDelay(attemptNumber: number): number {
    const base = this.config.retryBaseDelayMs;
    const jitter = Math.random() * 0.3 * base;
    const delay = Math.min(base * Math.pow(2, attemptNumber - 1) + jitter, this.config.retryMaxDelayMs);
    return Math.round(delay);
  }

  private async handleFailure(endpoint: WebhookEndpoint): Promise<void> {
    const state = endpoint.circuitState as CircuitStateCode;
    if (state === CircuitState.HALF_OPEN) {
      await this.circuitBreaker.recordHalfOpenFailure(endpoint.id);
    } else {
      await this.circuitBreaker.recordFailure(endpoint.id);
    }
  }

  private async readResponseBody(response: Response): Promise<string | null> {
    try {
      const text = await response.text();
      if (text.length > RESPONSE_BODY_MAX_LENGTH) {
        return text.slice(0, RESPONSE_BODY_MAX_LENGTH);
      }
      return text;
    } catch {
      return null;
    }
  }

  private elapsedMs(startedAt: bigint): number {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    return Math.round(Number(elapsedNs) / 1_000_000);
  }
}
