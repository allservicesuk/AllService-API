/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Polls BullMQ queue depth and oldest-waiting-age every 30s to feed Prometheus gauges.
 */
import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Queue } from 'bullmq';

import regionConfig from '@config/region.config';

import { MetricsService } from '../observability/metrics.service';

import { QUEUE_METRICS_POLL_INTERVAL_MS, QueueName, type QueueNameCode } from './queue.constants';

const STATE_WAITING = 'waiting';
const STATE_ACTIVE = 'active';
const STATE_DELAYED = 'delayed';
const STATE_COMPLETED = 'completed';
const STATE_FAILED = 'failed';
const MS_PER_SEC = 1_000;

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsService.name);
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    @InjectQueue(QueueName.MAIL) private readonly mailQueue: Queue,
    @InjectQueue(QueueName.AUDIT) private readonly auditQueue: Queue,
    @InjectQueue(QueueName.MAINTENANCE) private readonly maintenanceQueue: Queue,
    private readonly metrics: MetricsService,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => {
      void this.pollAll();
    }, QUEUE_METRICS_POLL_INTERVAL_MS);
    this.intervalHandle.unref();
    this.logger.log(
      `queue.metrics.poller.started intervalMs=${QUEUE_METRICS_POLL_INTERVAL_MS} region=${this.region.region}`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.logger.log('queue.metrics.poller.stopped');
    }
  }

  private async pollAll(): Promise<void> {
    await Promise.all([
      this.pollQueue(QueueName.MAIL, this.mailQueue),
      this.pollQueue(QueueName.AUDIT, this.auditQueue),
      this.pollQueue(QueueName.MAINTENANCE, this.maintenanceQueue),
    ]);
  }

  private async pollQueue(name: QueueNameCode, queue: Queue): Promise<void> {
    try {
      const counts = await queue.getJobCounts(
        STATE_WAITING,
        STATE_ACTIVE,
        STATE_DELAYED,
        STATE_COMPLETED,
        STATE_FAILED,
      );
      this.setDepth(name, STATE_WAITING, counts[STATE_WAITING] ?? 0);
      this.setDepth(name, STATE_ACTIVE, counts[STATE_ACTIVE] ?? 0);
      this.setDepth(name, STATE_DELAYED, counts[STATE_DELAYED] ?? 0);
      this.setDepth(name, STATE_COMPLETED, counts[STATE_COMPLETED] ?? 0);
      this.setDepth(name, STATE_FAILED, counts[STATE_FAILED] ?? 0);
      this.metrics.queueWaitingJobs.set(
        { queue: name, region: this.region.region },
        counts[STATE_WAITING] ?? 0,
      );
      this.metrics.queueActiveJobs.set(
        { queue: name, region: this.region.region },
        counts[STATE_ACTIVE] ?? 0,
      );
      const oldestAgeSeconds = await this.getOldestWaitingAge(queue);
      this.metrics.queueOldestWaitingAgeSeconds.set(
        { queue: name, region: this.region.region },
        oldestAgeSeconds,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`queue.metrics.poll.failed queue=${name} reason=${reason}`);
    }
  }

  private setDepth(queueName: QueueNameCode, state: string, count: number): void {
    this.metrics.queueDepthTotal.set(
      { queue: queueName, state, region: this.region.region },
      count,
    );
  }

  private async getOldestWaitingAge(queue: Queue): Promise<number> {
    const waiting = await queue.getWaiting(0, 0);
    const oldest = waiting[0];
    if (!oldest) {
      return 0;
    }
    const ageMs = Date.now() - oldest.timestamp;
    return Math.max(0, ageMs / MS_PER_SEC);
  }
}
