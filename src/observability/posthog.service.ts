/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * PostHog analytics wrapper with Redis-cached feature flag lookups and graceful shutdown.
 */
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PostHog } from 'posthog-node';

import { RedisKeys } from '@common/constants';
import posthogConfig from '@config/posthog.config';
import regionConfig from '@config/region.config';

import { RedisService } from '../redis/redis.service';

const FLUSH_AT = 20;
const FLUSH_INTERVAL_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;
const FLAG_CACHE_TTL_SECONDS = 300;

@Injectable()
export class PostHogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;

  constructor(
    @Inject(posthogConfig.KEY) private readonly config: ConfigType<typeof posthogConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    if (!this.config.apiKey) {
      this.logger.warn('POSTHOG_API_KEY not set; PostHog disabled');
      return;
    }
    this.client = new PostHog(this.config.apiKey, {
      host: this.config.host,
      flushAt: FLUSH_AT,
      flushInterval: FLUSH_INTERVAL_MS,
    });
    this.logger.log(`PostHog initialised (host=${this.config.host})`);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.shutdown(SHUTDOWN_TIMEOUT_MS);
    this.logger.log('PostHog flushed and closed');
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  capture(userId: string, event: string, properties?: Record<string, unknown>): void {
    if (!this.client) {
      return;
    }
    this.client.capture({
      distinctId: userId,
      event,
      properties: { ...properties, region: this.region.region },
    });
  }

  identify(userId: string, properties: Record<string, unknown>): void {
    if (!this.client) {
      return;
    }
    this.client.identify({ distinctId: userId, properties });
  }

  async isFeatureEnabled(flagName: string, userId: string): Promise<boolean> {
    const cacheKey = RedisKeys.cache(this.region.region, 'posthog', `ff:${flagName}:${userId}`);
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === '1';
    }
    if (!this.client) {
      return false;
    }
    const enabled = (await this.client.isFeatureEnabled(flagName, userId)) ?? false;
    await this.redis.set(cacheKey, enabled ? '1' : '0', FLAG_CACHE_TTL_SECONDS);
    return enabled;
  }
}
