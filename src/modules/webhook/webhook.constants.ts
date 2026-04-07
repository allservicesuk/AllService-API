/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Webhook event type registry and delivery job name constants.
 */
export const WebhookEventType = {
  APPLICATION_SUBMITTED: 'career.application.submitted',
  APPLICATION_STATUS_CHANGED: 'career.application.status_changed',
  APPLICATION_WITHDRAWN: 'career.application.withdrawn',
  POSTING_PUBLISHED: 'career.posting.published',
  POSTING_CLOSED: 'career.posting.closed',
  POSTING_ARCHIVED: 'career.posting.archived',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOCKED: 'user.locked',
  USER_UNLOCKED: 'user.unlocked',
  AUTH_LOGIN: 'auth.login',
  AUTH_MFA_ENABLED: 'auth.mfa.enabled',
} as const;

export type WebhookEventTypeCode = (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const ALL_WEBHOOK_EVENT_TYPES: readonly WebhookEventTypeCode[] = Object.values(WebhookEventType);

export const WebhookJobName = {
  DELIVER: 'webhook-deliver',
  RETRY: 'webhook-retry',
} as const;

export type WebhookJobNameCode = (typeof WebhookJobName)[keyof typeof WebhookJobName];

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
} as const;

export type CircuitStateCode = (typeof CircuitState)[keyof typeof CircuitState];

export const WEBHOOK_SIGNATURE_HEADER = 'x-allservices-signature';
export const WEBHOOK_TIMESTAMP_HEADER = 'x-allservices-timestamp';
export const WEBHOOK_EVENT_ID_HEADER = 'x-allservices-event-id';
export const WEBHOOK_EVENT_TYPE_HEADER = 'x-allservices-event-type';

export const SIGNING_SECRET_BYTES = 32;
