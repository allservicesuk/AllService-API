/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * BullMQ processor that delivers webhook events to registered endpoints with retry scheduling.
 */
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';

import webhookConfig from '@config/webhook.config';
import regionConfig from '@config/region.config';

import { MetricsService } from '../../observability/metrics.service';
import { SentryService } from '../../observability/sentry.service';
import { WebhookCircuitBreakerService } from '../../modules/webhook/webhook-circuit-breaker.service';
import { WebhookDeliveryService } from '../../modules/webhook/webhook-delivery.service';
import { WebhookService } from '../../modules/webhook/webhook.service';
import {
  WebhookJobName,
  type WebhookJobNameCode,
} from '../../modules/webhook/webhook.constants';
import { QueueName, WEBHOOK_WORKER_CONCURRENCY } from '../queue.constants';

interface WebhookJobData {
  readonly eventId: string;
  readonly endpointId: string;
  readonly attemptNumber: number;
}

@Processor(QueueName.WEBHOOK, { concurrency: WEBHOOK_WORKER_CONCURRENCY })
export class WebhookProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    @InjectQueue(QueueName.WEBHOOK) private readonly webhookQueue: Queue,
    @Inject(webhookConfig.KEY) private readonly config: ConfigType<typeof webhookConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly webhookService: WebhookService,
    private readonly deliveryService: WebhookDeliveryService,
    private readonly circuitBreaker: WebhookCircuitBreakerService,
    private readonly metrics: MetricsService,
    private readonly sentry: SentryService,
  ) {
    super();
  }

  onModuleInit(): void {
    const actual = this.worker.concurrency;
    if (actual !== WEBHOOK_WORKER_CONCURRENCY) {
      throw new Error(
        `webhook.processor.misconfigured expected=${WEBHOOK_WORKER_CONCURRENCY} actual=${actual}`,
      );
    }
    this.logger.log(
      `webhook.processor.ready concurrency=${actual} region=${this.region.region}`,
    );
  }

  async process(job: Job<WebhookJobData, unknown, string>): Promise<{ delivered: boolean }> {
    const jobName = job.name as WebhookJobNameCode;
    const { eventId, endpointId, attemptNumber } = job.data;
    const startedAt = process.hrtime.bigint();

    try {
      const [endpoint, event] = await Promise.all([
        this.webhookService.findEndpointById(endpointId),
        this.webhookService.findEventById(eventId),
      ]);

      if (endpoint.status === 'DISABLED') {
        this.logger.warn(
          `webhook.processor.skipped.disabled endpointId=${endpointId} eventId=${eventId}`,
        );
        return { delivered: false };
      }

      if (!this.circuitBreaker.shouldDeliver(endpoint)) {
        await this.webhookService.createDelivery(eventId, attemptNumber).then((d) =>
          this.webhookService.updateDelivery(d.id, {
            status: 'CIRCUIT_OPEN',
            errorMessage: 'Circuit breaker is open',
          }),
        );
        this.logger.warn(
          `webhook.processor.skipped.circuit_open endpointId=${endpointId} eventId=${eventId}`,
        );
        return { delivered: false };
      }

      const result = await this.deliveryService.deliver(endpoint, event, attemptNumber);

      this.recordMetrics(jobName, startedAt, result.success);

      if (!result.success && attemptNumber < this.config.maxRetries) {
        const delay = this.deliveryService.calculateRetryDelay(attemptNumber);
        await this.webhookQueue.add(
          WebhookJobName.RETRY,
          {
            eventId,
            endpointId,
            attemptNumber: attemptNumber + 1,
          },
          {
            delay,
            attempts: 1,
            removeOnComplete: { age: 3_600, count: 5_000 },
            removeOnFail: { age: 86_400, count: 10_000 },
          },
        );
        this.logger.log(
          `webhook.processor.retry_scheduled endpointId=${endpointId} eventId=${eventId} attempt=${attemptNumber + 1} delayMs=${delay}`,
        );
      }

      return { delivered: result.success };
    } catch (error) {
      this.recordMetrics(jobName, startedAt, false);
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `webhook.processor.error endpointId=${endpointId} eventId=${eventId} attempt=${attemptNumber} reason=${message}`,
      );
      this.sentry.captureException(error instanceof Error ? error : new Error(message), {
        region: this.region.region,
        tags: { queue: QueueName.WEBHOOK, jobName },
      });
      throw error;
    }
  }

  private recordMetrics(
    jobName: WebhookJobNameCode,
    startedAt: bigint,
    success: boolean,
  ): void {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const seconds = Number(elapsedNs) / 1_000_000_000;
    this.metrics.webhookDeliveryTotal.inc({
      status: success ? 'success' : 'failure',
      region: this.region.region,
    });
    this.metrics.webhookDeliveryDuration.observe(
      { region: this.region.region },
      seconds,
    );
  }
}
