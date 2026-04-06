/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * BullMQ processor that runs scheduled clean-up jobs and replays audit dead-letter entries.
 */
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@prisma/client';

import regionConfig from '@config/region.config';

import { PRISMA_WRITE } from '../../database/database.tokens';
import { ApplicantTokenService } from '../../modules/careers/applicant-token.service';
import { ApplicationService } from '../../modules/careers/application.service';
import { PostingService } from '../../modules/careers/posting.service';
import { REDIS_CLIENT } from '../../redis/redis.tokens';
import {
  CLOSE_EXPIRED_POSTINGS_EVERY_MS,
  MAINTENANCE_WORKER_CONCURRENCY,
  MaintenanceJobName,
  type MaintenanceJobNameCode,
  PRUNE_APPLICANT_TOKENS_EVERY_MS,
  PRUNE_DRAFT_APPLICATIONS_EVERY_MS,
  PRUNE_EXPIRED_SESSIONS_EVERY_MS,
  PRUNE_ORPHANED_CRYPTO_EVERY_MS,
  PRUNE_REFRESH_FAMILIES_EVERY_MS,
  QueueName,
  REPLAY_DEAD_LETTER_EVERY_MS,
  buildAuditDeadLetterKey,
  buildCryptoScanPattern,
  buildSessionScanPattern,
} from '../queue.constants';

const REDIS_TTL_NO_EXPIRY = -1;
const REDIS_TTL_MISSING = -2;
const REDIS_SCAN_COUNT = 200;
const DEAD_LETTER_BATCH_SIZE = 100;

interface DeadLetterPayload {
  readonly entry: Record<string, unknown>;
  readonly error: string;
  readonly enqueuedAt: string;
  readonly attemptsMade: number;
}

@Processor(QueueName.MAINTENANCE, { concurrency: MAINTENANCE_WORKER_CONCURRENCY })
export class MaintenanceProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(
    @InjectQueue(QueueName.MAINTENANCE) private readonly maintenanceQueue: Queue,
    @InjectQueue(QueueName.AUDIT) private readonly auditQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(PRISMA_WRITE) private readonly prisma: PrismaClient,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly postingService: PostingService,
    private readonly applicantTokenService: ApplicantTokenService,
    private readonly applicationService: ApplicationService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (!this.region.isWriteCapable) {
      this.logger.log(
        `maintenance.scheduler.skipped region=${this.region.region} role=${this.region.role}`,
      );
      return;
    }
    await this.scheduleRepeating(
      MaintenanceJobName.PRUNE_EXPIRED_SESSIONS,
      PRUNE_EXPIRED_SESSIONS_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.PRUNE_EXPIRED_REFRESH_FAMILIES,
      PRUNE_REFRESH_FAMILIES_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.PRUNE_ORPHANED_CRYPTO_KEYS,
      PRUNE_ORPHANED_CRYPTO_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.REPLAY_AUDIT_DEAD_LETTER,
      REPLAY_DEAD_LETTER_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.CLOSE_EXPIRED_POSTINGS,
      CLOSE_EXPIRED_POSTINGS_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.PRUNE_EXPIRED_APPLICANT_TOKENS,
      PRUNE_APPLICANT_TOKENS_EVERY_MS,
    );
    await this.scheduleRepeating(
      MaintenanceJobName.PRUNE_DRAFT_APPLICATIONS,
      PRUNE_DRAFT_APPLICATIONS_EVERY_MS,
    );
    this.logger.log(`maintenance.scheduler.ready region=${this.region.region}`);
  }

  async process(job: Job<unknown, unknown, string>): Promise<{ processed: number }> {
    const name = job.name as MaintenanceJobNameCode;
    switch (name) {
      case MaintenanceJobName.PRUNE_EXPIRED_SESSIONS:
        return {
          processed: await this.pruneLeakedKeys(
            buildSessionScanPattern(this.region.region),
            'session',
          ),
        };
      case MaintenanceJobName.PRUNE_EXPIRED_REFRESH_FAMILIES:
        return { processed: await this.pruneExpiredRefreshFamilies() };
      case MaintenanceJobName.PRUNE_ORPHANED_CRYPTO_KEYS:
        return {
          processed: await this.pruneLeakedKeys(
            buildCryptoScanPattern(this.region.region),
            'crypto',
          ),
        };
      case MaintenanceJobName.REPLAY_AUDIT_DEAD_LETTER:
        return { processed: await this.replayAuditDeadLetter() };
      case MaintenanceJobName.CLOSE_EXPIRED_POSTINGS:
        return { processed: await this.closeExpiredPostings() };
      case MaintenanceJobName.PRUNE_EXPIRED_APPLICANT_TOKENS:
        return { processed: await this.pruneExpiredApplicantTokens() };
      case MaintenanceJobName.PRUNE_DRAFT_APPLICATIONS:
        return { processed: await this.pruneDraftApplications() };
      default:
        throw new Error(`maintenance.processor.unknown_job name=${String(name)}`);
    }
  }

  private async scheduleRepeating(name: MaintenanceJobNameCode, everyMs: number): Promise<void> {
    await this.maintenanceQueue.add(
      name,
      {},
      {
        repeat: { every: everyMs },
        jobId: `${name}:${this.region.region}`,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      },
    );
    this.logger.log(`maintenance.scheduled name=${name} everyMs=${everyMs}`);
  }

  private async pruneLeakedKeys(pattern: string, label: string): Promise<number> {
    let cursor = '0';
    let scanned = 0;
    let deleted = 0;
    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;
      scanned += batch.length;
      for (const key of batch) {
        const ttl = await this.redis.ttl(key);
        if (ttl === REDIS_TTL_NO_EXPIRY) {
          await this.redis.del(key);
          deleted += 1;
          this.logger.warn(`maintenance.leaked_key label=${label} key=${key} ttl=none`);
        } else if (ttl === REDIS_TTL_MISSING) {
          continue;
        }
      }
    } while (cursor !== '0');
    this.logger.log(
      `maintenance.prune.${label}.done scanned=${scanned} deleted=${deleted} region=${this.region.region}`,
    );
    return deleted;
  }

  private async pruneExpiredRefreshFamilies(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.refreshTokenFamily.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    this.logger.log(
      `maintenance.prune.refresh_families.done deleted=${result.count} region=${this.region.region}`,
    );
    return result.count;
  }

  private async replayAuditDeadLetter(): Promise<number> {
    const key = buildAuditDeadLetterKey(this.region.region);
    let replayed = 0;
    for (let i = 0; i < DEAD_LETTER_BATCH_SIZE; i += 1) {
      const raw = await this.redis.lpop(key);
      if (raw === null) {
        break;
      }
      const record = this.parseDeadLetter(raw);
      if (!record) {
        this.logger.warn(`maintenance.dead_letter.corrupt key=${key} raw=${raw.slice(0, 120)}`);
        continue;
      }
      await this.auditQueue.add('replay', record.entry, { attempts: 3 });
      replayed += 1;
    }
    if (replayed > 0) {
      this.logger.log(
        `maintenance.dead_letter.replayed count=${replayed} region=${this.region.region}`,
      );
    }
    return replayed;
  }

  private async closeExpiredPostings(): Promise<number> {
    const count = await this.postingService.closeExpiredPostings();
    if (count > 0) {
      this.logger.log(
        `maintenance.close_expired_postings.done count=${count} region=${this.region.region}`,
      );
    }
    return count;
  }

  private async pruneExpiredApplicantTokens(): Promise<number> {
    const count = await this.applicantTokenService.pruneExpiredTokens();
    if (count > 0) {
      this.logger.log(
        `maintenance.prune_applicant_tokens.done count=${count} region=${this.region.region}`,
      );
    }
    return count;
  }

  private async pruneDraftApplications(): Promise<number> {
    const count = await this.applicationService.pruneDraftApplications();
    if (count > 0) {
      this.logger.log(
        `maintenance.prune_draft_applications.done count=${count} region=${this.region.region}`,
      );
    }
    return count;
  }

  private parseDeadLetter(raw: string): DeadLetterPayload | null {
    try {
      const parsed = JSON.parse(raw) as DeadLetterPayload;
      if (!parsed.entry || typeof parsed.entry !== 'object') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
