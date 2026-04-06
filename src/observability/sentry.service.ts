/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Sentry SDK wrapper: init with PII-stripping beforeSend, region tags, profiling, and graceful flush.
 */
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import regionConfig from '@config/region.config';
import sentryConfig from '@config/sentry.config';

const FLUSH_TIMEOUT_MS = 2000;
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const IPV4_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

export type SentryContext = {
  requestId?: string;
  userId?: string;
  region?: string;
  tags?: Record<string, string>;
};

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SentryService.name);
  private enabled = false;

  constructor(
    @Inject(sentryConfig.KEY) private readonly config: ConfigType<typeof sentryConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {}

  onModuleInit(): void {
    if (!this.config.dsn) {
      this.logger.warn('SENTRY_DSN not set; Sentry disabled');
      return;
    }
    const release = process.env['SENTRY_RELEASE'] ?? process.env['GIT_SHA'];
    Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      tracesSampleRate: this.config.tracesSampleRate,
      profilesSampleRate: this.config.tracesSampleRate,
      integrations: [nodeProfilingIntegration()],
      beforeSend: (event) => this.stripPii(event),
      ...(release ? { release } : {}),
    });
    Sentry.setTag('region', this.region.region);
    Sentry.setTag('regionRole', this.region.role);
    this.enabled = true;
    this.logger.log(`Sentry initialised (env=${this.config.environment})`);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    await Sentry.close(FLUSH_TIMEOUT_MS);
    this.logger.log('Sentry flushed and closed');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  captureException(error: unknown, context?: SentryContext): void {
    if (!this.enabled) {
      return;
    }
    Sentry.withScope((scope) => {
      this.applyContext(scope, context);
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel, context?: SentryContext): void {
    if (!this.enabled) {
      return;
    }
    Sentry.withScope((scope) => {
      this.applyContext(scope, context);
      Sentry.captureMessage(message, level);
    });
  }

  setUser(userId: string): void {
    if (!this.enabled) {
      return;
    }
    Sentry.setUser({ id: userId });
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.enabled) {
      return;
    }
    Sentry.addBreadcrumb(breadcrumb);
  }

  private applyContext(scope: Sentry.Scope, context?: SentryContext): void {
    if (!context) {
      return;
    }
    if (context.requestId !== undefined) {
      scope.setTag('requestId', context.requestId);
    }
    if (context.userId !== undefined) {
      scope.setUser({ id: context.userId });
    }
    if (context.region !== undefined) {
      scope.setTag('region', context.region);
    }
    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
  }

  private stripPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }
    if (event.message) {
      event.message = this.redact(event.message);
    }
    if (event.exception?.values) {
      for (const exc of event.exception.values) {
        if (exc.value) {
          exc.value = this.redact(exc.value);
        }
      }
    }
    return event;
  }

  private redact(input: string): string {
    return input.replace(EMAIL_REGEX, '[redacted-email]').replace(IPV4_REGEX, '[redacted-ip]');
  }
}
