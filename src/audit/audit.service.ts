/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Append-only hash-chained audit log writer serialised via pg_advisory_xact_lock.
 */
import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';

import { generateId } from '@common/utils/id.util';
import { PRISMA_WRITE } from '@database/database.tokens';

const AUDIT_LOCK_KEY = 1_932_474_216n;
const GENESIS_INPUT = 'allservices-audit-genesis';
const HASH_FIELD_SEPARATOR = '|';

export interface AuditEntry {
  readonly action: string;
  readonly userId: string | null;
  readonly resource: string | null;
  readonly detail: Record<string, unknown> | null;
  readonly ipHash: string;
  readonly userAgent: string | null;
  readonly region: string;
  readonly requestId: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly genesisHash: string;

  constructor(@Inject(PRISMA_WRITE) private readonly prisma: PrismaClient) {
    this.genesisHash = createHash('sha256').update(GENESIS_INPUT, 'utf8').digest('hex');
  }

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_LOCK_KEY})`;
      const last = await tx.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { currentHash: true },
      });
      const previousHash = last?.currentHash ?? this.genesisHash;
      const createdAt = new Date();
      const currentHash = this.computeHash(entry, previousHash, createdAt);
      await tx.auditLog.create({
        data: {
          id: generateId(),
          action: entry.action,
          userId: entry.userId,
          resource: entry.resource,
          detail: entry.detail === null ? Prisma.DbNull : (entry.detail as Prisma.InputJsonValue),
          ipHash: entry.ipHash,
          userAgent: entry.userAgent,
          region: entry.region,
          requestId: entry.requestId,
          previousHash,
          currentHash,
          createdAt,
        },
      });
    });
    this.logger.log(
      `audit.logged action=${entry.action} requestId=${entry.requestId} region=${entry.region}`,
    );
  }

  private computeHash(entry: AuditEntry, previousHash: string, createdAt: Date): string {
    const payload = [
      entry.action,
      entry.userId ?? '',
      entry.resource ?? '',
      entry.detail === null ? '' : this.canonicalJson(entry.detail),
      entry.ipHash,
      entry.region,
      entry.requestId,
      previousHash,
      createdAt.toISOString(),
    ].join(HASH_FIELD_SEPARATOR);
    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  private canonicalJson(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalJson(item)).join(',')}]`;
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}:${this.canonicalJson(obj[key])}`);
    return `{${entries.join(',')}}`;
  }
}
