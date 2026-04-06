/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Per-queue BullMQ QueueEvents listeners that forward completed/failed/stalled events to observability.
 */
import { InjectQueue, OnQueueEvent, QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Queue } from 'bullmq';

import regionConfig from '@config/region.config';

import { MetricsService } from '../observability/metrics.service';
import { SentryService } from '../observability/sentry.service';

import { QueueName, type QueueNameCode } from './queue.constants';

interface FailedEventArgs {
  readonly jobId: string;
  readonly failedReason: string;
  readonly prev?: string;
}

interface CompletedEventArgs {
  readonly jobId: string;
  readonly returnvalue: string;
  readonly prev?: string;
}

interface StalledEventArgs {
  readonly jobId: string;
}

const UNKNOWN_JOB_NAME = 'unknown';
const ERROR_SNIPPET_MAX_LENGTH = 500;

abstract class BaseQueueEventsListener extends QueueEventsHost {
  protected readonly logger: Logger;

  protected constructor(
    protected readonly queueName: QueueNameCode,
    protected readonly queue: Queue,
    protected readonly metrics: MetricsService,
    protected readonly sentry: SentryService,
    protected readonly region: ConfigType<typeof regionConfig>,
  ) {
    super();
    this.logger = new Logger(`${queueName}.queue-events`);
  }

  protected async handleCompleted(args: CompletedEventArgs): Promise<void> {
    const name = await this.resolveJobName(args.jobId);
    this.metrics.queueJobCompletedTotal.inc({
      queue: this.queueName,
      name,
      region: this.region.region,
    });
    this.logger.debug(`queue.completed queue=${this.queueName} name=${name} jobId=${args.jobId}`);
  }

  protected async handleFailed(args: FailedEventArgs): Promise<void> {
    const job = await this.queue.getJob(args.jobId);
    const name = job?.name ?? UNKNOWN_JOB_NAME;
    const attemptsMade = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts.attempts ?? 1;
    this.metrics.queueJobFailedTotal.inc({
      queue: this.queueName,
      name,
      region: this.region.region,
    });
    const reasonSnippet = args.failedReason.slice(0, ERROR_SNIPPET_MAX_LENGTH);
    this.logger.warn(
      `queue.failed queue=${this.queueName} name=${name} jobId=${args.jobId} attempt=${attemptsMade}/${maxAttempts} reason=${reasonSnippet}`,
    );
    if (attemptsMade >= maxAttempts) {
      this.sentry.captureMessage(
        `queue.retries_exhausted queue=${this.queueName} name=${name}`,
        'error',
        {
          region: this.region.region,
          tags: { queue: this.queueName, jobName: name },
        },
      );
    }
  }

  protected handleStalled(args: StalledEventArgs): void {
    this.metrics.queueJobStalledTotal.inc({
      queue: this.queueName,
      region: this.region.region,
    });
    this.logger.warn(`queue.stalled queue=${this.queueName} jobId=${args.jobId}`);
  }

  private async resolveJobName(jobId: string): Promise<string> {
    const job = await this.queue.getJob(jobId);
    return job?.name ?? UNKNOWN_JOB_NAME;
  }
}

@QueueEventsListener(QueueName.MAIL)
export class MailQueueEventsListener extends BaseQueueEventsListener {
  constructor(
    @InjectQueue(QueueName.MAIL) queue: Queue,
    metrics: MetricsService,
    sentry: SentryService,
    @Inject(regionConfig.KEY) region: ConfigType<typeof regionConfig>,
  ) {
    super(QueueName.MAIL, queue, metrics, sentry, region);
  }

  @OnQueueEvent('completed')
  async onCompleted(args: CompletedEventArgs): Promise<void> {
    await this.handleCompleted(args);
  }

  @OnQueueEvent('failed')
  async onFailed(args: FailedEventArgs): Promise<void> {
    await this.handleFailed(args);
  }

  @OnQueueEvent('stalled')
  onStalled(args: StalledEventArgs): void {
    this.handleStalled(args);
  }
}

@QueueEventsListener(QueueName.AUDIT)
export class AuditQueueEventsListener extends BaseQueueEventsListener {
  constructor(
    @InjectQueue(QueueName.AUDIT) queue: Queue,
    metrics: MetricsService,
    sentry: SentryService,
    @Inject(regionConfig.KEY) region: ConfigType<typeof regionConfig>,
  ) {
    super(QueueName.AUDIT, queue, metrics, sentry, region);
  }

  @OnQueueEvent('completed')
  async onCompleted(args: CompletedEventArgs): Promise<void> {
    await this.handleCompleted(args);
  }

  @OnQueueEvent('failed')
  async onFailed(args: FailedEventArgs): Promise<void> {
    await this.handleFailed(args);
  }

  @OnQueueEvent('stalled')
  onStalled(args: StalledEventArgs): void {
    this.handleStalled(args);
  }
}

@QueueEventsListener(QueueName.MAINTENANCE)
export class MaintenanceQueueEventsListener extends BaseQueueEventsListener {
  constructor(
    @InjectQueue(QueueName.MAINTENANCE) queue: Queue,
    metrics: MetricsService,
    sentry: SentryService,
    @Inject(regionConfig.KEY) region: ConfigType<typeof regionConfig>,
  ) {
    super(QueueName.MAINTENANCE, queue, metrics, sentry, region);
  }

  @OnQueueEvent('completed')
  async onCompleted(args: CompletedEventArgs): Promise<void> {
    await this.handleCompleted(args);
  }

  @OnQueueEvent('failed')
  async onFailed(args: FailedEventArgs): Promise<void> {
    await this.handleFailed(args);
  }

  @OnQueueEvent('stalled')
  onStalled(args: StalledEventArgs): void {
    this.handleStalled(args);
  }
}
