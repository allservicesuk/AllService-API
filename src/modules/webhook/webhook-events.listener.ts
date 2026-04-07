/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Listens to domain events and fans them out to matching webhook endpoints via the webhook delivery queue.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import { QueueName } from '../../queue/queue.constants';

import { WebhookService } from './webhook.service';
import {
  WebhookEventType,
  WebhookJobName,
  type WebhookEventTypeCode,
} from './webhook.constants';

@Injectable()
export class WebhookEventsListener {
  private readonly logger = new Logger(WebhookEventsListener.name);

  constructor(
    private readonly webhookService: WebhookService,
    @InjectQueue(QueueName.WEBHOOK) private readonly webhookQueue: Queue,
  ) {}

  @OnEvent('career.application.submitted')
  async onApplicationSubmitted(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.APPLICATION_SUBMITTED, payload);
  }

  @OnEvent('career.application.status_changed')
  async onApplicationStatusChanged(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.APPLICATION_STATUS_CHANGED, payload);

    const toStatus = payload['toStatus'];
    if (toStatus === 'WITHDRAWN') {
      await this.fanOut(WebhookEventType.APPLICATION_WITHDRAWN, payload);
    }
  }

  @OnEvent('career.posting.published')
  async onPostingPublished(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.POSTING_PUBLISHED, payload);
  }

  @OnEvent('career.posting.closed')
  async onPostingClosed(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.POSTING_CLOSED, payload);
  }

  @OnEvent('career.posting.archived')
  async onPostingArchived(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.POSTING_ARCHIVED, payload);
  }

  @OnEvent('user.created')
  async onUserCreated(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.USER_CREATED, payload);
  }

  @OnEvent('user.updated')
  async onUserUpdated(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.USER_UPDATED, payload);
  }

  @OnEvent('user.deleted')
  async onUserDeleted(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.USER_DELETED, payload);
  }

  @OnEvent('user.locked')
  async onUserLocked(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.USER_LOCKED, payload);
  }

  @OnEvent('user.unlocked')
  async onUserUnlocked(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.USER_UNLOCKED, payload);
  }

  @OnEvent('auth.login')
  async onAuthLogin(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.AUTH_LOGIN, payload);
  }

  @OnEvent('auth.mfa.enabled')
  async onMfaEnabled(payload: Record<string, unknown>): Promise<void> {
    await this.fanOut(WebhookEventType.AUTH_MFA_ENABLED, payload);
  }

  private async fanOut(
    eventType: WebhookEventTypeCode,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const endpoints = await this.webhookService.findActiveEndpointsForEvent(eventType);
      if (endpoints.length === 0) {
        return;
      }

      for (const endpoint of endpoints) {
        const event = await this.webhookService.createEvent(endpoint.id, eventType, {
          ...payload,
          eventType,
          occurredAt: new Date().toISOString(),
        });

        await this.webhookQueue.add(
          WebhookJobName.DELIVER,
          {
            eventId: event.id,
            endpointId: endpoint.id,
            attemptNumber: 1,
          },
          {
            attempts: 1,
            removeOnComplete: { age: 3_600, count: 5_000 },
            removeOnFail: { age: 86_400, count: 10_000 },
          },
        );
      }

      this.logger.log(
        `webhook.fan_out eventType=${eventType} endpoints=${endpoints.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`webhook.fan_out.error eventType=${eventType} reason=${message}`);
    }
  }
}
