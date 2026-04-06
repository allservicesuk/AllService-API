/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Manages refresh-token families in Postgres and session metadata in Redis with reuse detection.
 */
import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';

import { ErrorCode, RedisKeys } from '@common/constants';
import { generateId } from '@common/utils/id.util';
import jwtConfig from '@config/jwt.config';
import regionConfig from '@config/region.config';

import { AuditService, type AuditEntry } from '../../audit/audit.service';
import { PRISMA_READ, PRISMA_WRITE } from '../../database/database.tokens';
import { SentryService } from '../../observability/sentry.service';
import { RedisService } from '../../redis/redis.service';

import { TokenService } from './token.service';

const SHA256_ALGO = 'sha256';
const HEX = 'hex';
const SESSION_RECENT_ACTIVITY_THRESHOLD_MS = 5 * 60 * 1_000;

export interface SessionCreateResult {
  readonly sessionId: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
}

export interface SessionMetadata {
  readonly sessionId: string;
  readonly deviceInfo: string | null;
  readonly ipHash: string;
  readonly refreshTokenHash: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
}

export interface SessionInfo {
  readonly sessionId: string;
  readonly deviceInfo: string | null;
  readonly ipHash: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly isCurrent: boolean;
}

export interface RefreshContext {
  readonly ipHash: string;
  readonly userAgent: string | null;
  readonly requestId: string;
}

export interface RefreshResult {
  readonly userId: string;
  readonly sessionId: string;
  readonly refreshToken: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    @Inject(jwtConfig.KEY) private readonly jwt: ConfigType<typeof jwtConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly sentry: SentryService,
    private readonly tokenService: TokenService,
  ) {}

  async create(
    userId: string,
    deviceInfo: string | null,
    ipHash: string,
  ): Promise<SessionCreateResult> {
    const sessionId = generateId();
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.jwt.refreshTtlSeconds * 1_000);
    await this.prismaWrite.refreshTokenFamily.create({
      data: {
        id: sessionId,
        userId,
        currentTokenHash: refreshTokenHash,
        region: this.region.region,
        deviceInfo,
        ipHash,
        expiresAt,
      },
    });
    const now = new Date().toISOString();
    const metadata: SessionMetadata = {
      sessionId,
      deviceInfo,
      ipHash,
      refreshTokenHash,
      createdAt: now,
      lastActiveAt: now,
    };
    await this.redis.setJson(
      RedisKeys.session(this.region.region, userId, sessionId),
      metadata,
      this.jwt.refreshTtlSeconds,
    );
    return { sessionId, refreshToken, expiresAt };
  }

  async refresh(rawRefreshToken: string, context: RefreshContext): Promise<RefreshResult> {
    const incomingHash = this.hashToken(rawRefreshToken);
    const family = await this.prismaRead.refreshTokenFamily.findFirst({
      where: { currentTokenHash: incomingHash },
    });
    if (!family) {
      const reuseFamily = await this.findFamilyByReuse(incomingHash);
      if (reuseFamily) {
        await this.handleReuse(reuseFamily.id, reuseFamily.userId, context);
        throw new UnauthorizedException({
          code: ErrorCode.REFRESH_TOKEN_REUSED,
          message: 'Refresh token reuse detected; all sessions invalidated',
        });
      }
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
      });
    }
    if (family.isRevoked) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_REVOKED,
        message: 'Refresh token is revoked',
      });
    }
    if (family.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Refresh token is expired',
      });
    }
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newHash = this.hashToken(newRefreshToken);
    const now = new Date();
    await this.prismaWrite.refreshTokenFamily.update({
      where: { id: family.id },
      data: { currentTokenHash: newHash, lastUsedAt: now },
    });
    const sessionKey = RedisKeys.session(this.region.region, family.userId, family.id);
    const metadata = await this.redis.getJson<SessionMetadata>(sessionKey);
    if (metadata) {
      const updated: SessionMetadata = {
        ...metadata,
        refreshTokenHash: newHash,
        lastActiveAt: now.toISOString(),
      };
      await this.redis.setJson(sessionKey, updated, this.jwt.refreshTtlSeconds);
    }
    return { userId: family.userId, sessionId: family.id, refreshToken: newRefreshToken };
  }

  async revoke(sessionId: string, userId: string, context: RefreshContext): Promise<void> {
    await this.redis.del(RedisKeys.session(this.region.region, userId, sessionId));
    await this.prismaWrite.refreshTokenFamily.updateMany({
      where: { id: sessionId, userId, isRevoked: false },
      data: { isRevoked: true, revokedReason: 'user_logout' },
    });
    await this.writeAudit('auth.session.revoked', userId, context, { sessionId });
  }

  async revokeAll(userId: string, context: RefreshContext, reason: string): Promise<void> {
    await this.deleteRedisSessions(userId);
    await this.prismaWrite.refreshTokenFamily.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedReason: reason },
    });
    await this.writeAudit('auth.session.revoked.all', userId, context, { reason });
  }

  async revokeAllExcept(
    userId: string,
    keepSessionId: string,
    context: RefreshContext,
  ): Promise<void> {
    const pattern = RedisKeys.sessionPattern(this.region.region, userId);
    const keys = await this.redis.scan(pattern);
    const keepKey = RedisKeys.session(this.region.region, userId, keepSessionId);
    for (const key of keys) {
      if (key !== keepKey) {
        await this.redis.del(key);
      }
    }
    await this.prismaWrite.refreshTokenFamily.updateMany({
      where: { userId, isRevoked: false, NOT: { id: keepSessionId } },
      data: { isRevoked: true, revokedReason: 'password_changed' },
    });
    await this.writeAudit('auth.session.revoked.all_except', userId, context, { keepSessionId });
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const pattern = RedisKeys.sessionPattern(this.region.region, userId);
    const keys = await this.redis.scan(pattern);
    const sessions: SessionInfo[] = [];
    for (const key of keys) {
      const metadata = await this.redis.getJson<SessionMetadata>(key);
      if (!metadata) {
        continue;
      }
      sessions.push({
        sessionId: metadata.sessionId,
        deviceInfo: metadata.deviceInfo,
        ipHash: metadata.ipHash,
        createdAt: metadata.createdAt,
        lastActiveAt: metadata.lastActiveAt,
        isCurrent: metadata.sessionId === currentSessionId,
      });
    }
    return sessions;
  }

  async updateLastActive(userId: string, sessionId: string): Promise<void> {
    const sessionKey = RedisKeys.session(this.region.region, userId, sessionId);
    const metadata = await this.redis.getJson<SessionMetadata>(sessionKey);
    if (!metadata) {
      return;
    }
    const lastActiveMs = Date.parse(metadata.lastActiveAt);
    if (
      Number.isFinite(lastActiveMs) &&
      Date.now() - lastActiveMs < SESSION_RECENT_ACTIVITY_THRESHOLD_MS
    ) {
      return;
    }
    const updated: SessionMetadata = { ...metadata, lastActiveAt: new Date().toISOString() };
    const ttl = await this.redis.ttl(sessionKey);
    const effectiveTtl = ttl > 0 ? ttl : this.jwt.refreshTtlSeconds;
    await this.redis.setJson(sessionKey, updated, effectiveTtl);
  }

  async getCurrentRefreshTokenHash(userId: string, sessionId: string): Promise<string | null> {
    const metadata = await this.redis.getJson<SessionMetadata>(
      RedisKeys.session(this.region.region, userId, sessionId),
    );
    return metadata?.refreshTokenHash ?? null;
  }

  hashToken(rawToken: string): string {
    return createHash(SHA256_ALGO).update(rawToken, 'utf8').digest(HEX);
  }

  private async findFamilyByReuse(
    incomingHash: string,
  ): Promise<{ id: string; userId: string } | null> {
    const revoked = await this.prismaRead.refreshTokenFamily.findFirst({
      where: { currentTokenHash: incomingHash, isRevoked: true },
      select: { id: true, userId: true },
    });
    return revoked ?? null;
  }

  private async handleReuse(
    familyId: string,
    userId: string,
    context: RefreshContext,
  ): Promise<void> {
    await this.prismaWrite.refreshTokenFamily.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedReason: 'token_reuse_detected' },
    });
    await this.deleteRedisSessions(userId);
    await this.writeAudit('auth.token.reuse_detected', userId, context, { familyId });
    this.sentry.captureMessage('refresh_token_reuse_detected', 'warning', {
      userId,
      region: this.region.region,
      tags: { familyId },
    });
    this.logger.warn(`auth.token.reuse_detected userId=${userId} familyId=${familyId}`);
  }

  private async deleteRedisSessions(userId: string): Promise<void> {
    const pattern = RedisKeys.sessionPattern(this.region.region, userId);
    const keys = await this.redis.scan(pattern);
    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  private async writeAudit(
    action: string,
    userId: string,
    context: RefreshContext,
    detail: Record<string, unknown> | null,
  ): Promise<void> {
    const entry: AuditEntry = {
      action,
      userId,
      resource: `user:${userId}`,
      detail,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      region: this.region.region,
      requestId: context.requestId,
    };
    await this.audit.log(entry);
  }
}
