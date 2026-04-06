/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Argon2id password hashing with strength validation and k-anonymity HaveIBeenPwned breach checks.
 */
import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';

import { RedisKeys } from '@common/constants';
import argon2Config from '@config/argon2.config';
import regionConfig from '@config/region.config';

import { RedisService } from '../../redis/redis.service';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PWNED_API_URL = 'https://api.pwnedpasswords.com/range/';
const PWNED_API_TIMEOUT_MS = 3_000;
const PWNED_CACHE_TTL_SECONDS = 24 * 60 * 60;
const PWNED_PREFIX_LENGTH = 5;
const PWNED_CACHE_MODULE = 'password';

export interface PasswordStrengthResult {
  readonly valid: boolean;
  readonly reason?: string;
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    @Inject(argon2Config.KEY) private readonly argon2: ConfigType<typeof argon2Config>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly redis: RedisService,
  ) {}

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.argon2.memoryCost,
      timeCost: this.argon2.timeCost,
      parallelism: this.argon2.parallelism,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`password.verify.failed reason=${reason}`);
      return false;
    }
  }

  validateStrength(password: string): PasswordStrengthResult {
    if (typeof password !== 'string') {
      return { valid: false, reason: 'password_not_string' };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return { valid: false, reason: 'password_too_short' };
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      return { valid: false, reason: 'password_too_long' };
    }
    return { valid: true };
  }

  async checkBreached(password: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
    const prefix = sha1.slice(0, PWNED_PREFIX_LENGTH);
    const suffix = sha1.slice(PWNED_PREFIX_LENGTH);
    const cacheKey = RedisKeys.cache(this.region.region, PWNED_CACHE_MODULE, `breach:${prefix}`);
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return this.suffixInRangeBody(cached, suffix);
    }
    const body = await this.fetchPwnedRange(prefix);
    if (body === null) {
      return false;
    }
    await this.redis.set(cacheKey, body, PWNED_CACHE_TTL_SECONDS);
    return this.suffixInRangeBody(body, suffix);
  }

  private async fetchPwnedRange(prefix: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PWNED_API_TIMEOUT_MS);
    try {
      const response = await fetch(`${PWNED_API_URL}${prefix}`, {
        method: 'GET',
        headers: { 'Add-Padding': 'true' },
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(`password.pwned.api.non_ok status=${response.status}`);
        return null;
      }
      return await response.text();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`password.pwned.api.failed reason=${reason}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private suffixInRangeBody(body: string, suffix: string): boolean {
    const lines = body.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex <= 0) {
        continue;
      }
      const candidate = line.slice(0, colonIndex).trim().toUpperCase();
      if (candidate === suffix) {
        const countStr = line.slice(colonIndex + 1).trim();
        const count = parseInt(countStr, 10);
        return Number.isFinite(count) && count > 0;
      }
    }
    return false;
  }
}
