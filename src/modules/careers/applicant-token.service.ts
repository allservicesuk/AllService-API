/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Manages magic-link tokens and 6-digit email verification codes for applicants.
 */
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';

import { RedisKeys } from '@common/constants/redis-keys';
import careersConfig from '@config/careers.config';
import regionConfig from '@config/region.config';

import { PRISMA_WRITE } from '../../database/database.tokens';
import { REDIS_CLIENT } from '../../redis/redis.tokens';

const TOKEN_BYTE_LENGTH = 64;
const CODE_MIN = 100000;
const CODE_MAX = 999999;

export interface VerifyCodeResult {
  readonly valid: boolean;
}

@Injectable()
export class ApplicantTokenService {
  private readonly logger = new Logger(ApplicantTokenService.name);

  constructor(
    @Inject(PRISMA_WRITE) private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(careersConfig.KEY) private readonly config: ConfigType<typeof careersConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {}

  async generateVerificationCode(email: string, jobPostingId: string): Promise<string> {
    const code = randomInt(CODE_MIN, CODE_MAX + 1).toString();
    const key = RedisKeys.careerVerifyCode(this.region.region, email, jobPostingId);
    await this.redis.set(key, code, 'EX', this.config.verifyCodeTtlSeconds);
    this.logger.log(`career.verify_code.generated email_hash=${this.hashForLog(email)}`);
    return code;
  }

  async verifyCode(email: string, jobPostingId: string, code: string): Promise<VerifyCodeResult> {
    const key = RedisKeys.careerVerifyCode(this.region.region, email, jobPostingId);
    const stored = await this.redis.get(key);

    if (!stored) {
      return { valid: false };
    }

    const storedBuf = Buffer.from(stored, 'utf8');
    const inputBuf = Buffer.from(code, 'utf8');

    if (storedBuf.length !== inputBuf.length) {
      return { valid: false };
    }

    const isValid = timingSafeEqual(storedBuf, inputBuf);

    if (isValid) {
      await this.redis.del(key);
    }

    return { valid: isValid };
  }

  async generateMagicLinkToken(applicationId: string): Promise<string> {
    const rawToken = randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.config.magicLinkTtlSeconds * 1000);

    await this.prisma.applicantToken.create({
      data: {
        applicationId,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(
      `career.magic_link.generated applicationId=${applicationId} expiresAt=${expiresAt.toISOString()}`,
    );
    return rawToken;
  }

  async validateMagicLinkToken(rawToken: string): Promise<string | null> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.prisma.applicantToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      return null;
    }

    return record.applicationId;
  }

  async pruneExpiredTokens(): Promise<number> {
    const result = await this.prisma.applicantToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  buildMagicLinkUrl(rawToken: string): string {
    const base = this.config.applyWebUrl.replace(/\/+$/, '');
    return `${base}/application?token=${encodeURIComponent(rawToken)}`;
  }

  private hashForLog(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 8);
  }
}
