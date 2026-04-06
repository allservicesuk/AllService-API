/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Single-worker BullMQ processor for async audit writes with Redis dead-letter on terminal failure.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Redis } from 'ioredis';

import regionConfig from '@config/region.config';

import { AuditService, type AuditEntry } from '../../audit/audit.service';
import { SentryService } from '../../observability/sentry.service';
import { REDIS_CLIENT } from '../../redis/redis.tokens';
import { AUDIT_WORKER_CONCURRENCY, QueueName, buildAuditDeadLetterKey } from '../queue.constants';

interface DeadLetterRecord {
  readonly entry: AuditEntry;
  readonly error: string;
  readonly enqueuedAt: string;
  readonly attemptsMade: number;
}

@Processor(QueueName.AUDIT, { concurrency: AUDIT_WORKER_CONCURRENCY })
export class AuditProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly sentry: SentryService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {
    super();
  }

  onModuleInit(): void {
    const actual = this.worker.concurrency;
    if (actual !== AUDIT_WORKER_CONCURRENCY) {
      throw new Error(
        `audit.processor.misconfigured expected=${AUDIT_WORKER_CONCURRENCY} actual=${actual}`,
      );
    }
    this.logger.log(`audit.processor.ready concurrency=${actual} region=${this.region.region}`);
  }

  async process(job: Job<unknown, unknown, string>): Promise<{ written: true }> {
    const entry = this.castEntry(job.data);
    try {
      await this.auditService.log(entry);
      return { written: true };
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;
      const nextAttempt = job.attemptsMade + 1;
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `audit.processor.write.failed attempt=${nextAttempt}/${maxAttempts} action=${entry.action} reason=${reason}`,
      );
      if (nextAttempt >= maxAttempts) {
        await this.writeDeadLetter(entry, reason, nextAttempt);
        this.sentry.captureMessage(`audit.dead_letter action=${entry.action}`, 'error', {
          region: this.region.region,
          tags: { queue: QueueName.AUDIT, jobName: job.name },
        });
      }
      throw error;
    }
  }

  private castEntry(payload: unknown): AuditEntry {
    if (payload === null || typeof payload !== 'object') {
      throw new Error('audit.processor.invalid_payload reason=not_object');
    }
    const candidate = payload as Partial<AuditEntry>;
    if (typeof candidate.action !== 'string' || candidate.action.length === 0) {
      throw new Error('audit.processor.invalid_payload reason=missing_action');
    }
    if (typeof candidate.ipHash !== 'string' || candidate.ipHash.length === 0) {
      throw new Error('audit.processor.invalid_payload reason=missing_ipHash');
    }
    if (typeof candidate.region !== 'string' || candidate.region.length === 0) {
      throw new Error('audit.processor.invalid_payload reason=missing_region');
    }
    if (typeof candidate.requestId !== 'string' || candidate.requestId.length === 0) {
      throw new Error('audit.processor.invalid_payload reason=missing_requestId');
    }
    return candidate as AuditEntry;
  }

  private async writeDeadLetter(
    entry: AuditEntry,
    error: string,
    attemptsMade: number,
  ): Promise<void> {
    const record: DeadLetterRecord = {
      entry,
      error,
      enqueuedAt: new Date().toISOString(),
      attemptsMade,
    };
    const key = buildAuditDeadLetterKey(this.region.region);
    try {
      await this.redis.rpush(key, JSON.stringify(record));
      this.logger.warn(
        `audit.dead_letter.written key=${key} action=${entry.action} requestId=${entry.requestId}`,
      );
    } catch (rpushError) {
      const reason = rpushError instanceof Error ? rpushError.message : 'unknown';
      this.logger.error(
        `audit.dead_letter.write_failed key=${key} action=${entry.action} reason=${reason}`,
      );
    }
  }
}
