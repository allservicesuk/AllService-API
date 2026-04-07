/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Queue names, maintenance job names, default job options, and BullMQ key-prefix constants.
 */
import type { JobsOptions } from 'bullmq';

export const QueueName = {
  MAIL: 'mail',
  AUDIT: 'audit',
  MAINTENANCE: 'maintenance',
  WEBHOOK: 'webhook',
} as const;

export type QueueNameCode = (typeof QueueName)[keyof typeof QueueName];

export const MaintenanceJobName = {
  PRUNE_EXPIRED_SESSIONS: 'prune-expired-sessions',
  PRUNE_EXPIRED_REFRESH_FAMILIES: 'prune-expired-refresh-families',
  PRUNE_ORPHANED_CRYPTO_KEYS: 'prune-orphaned-crypto-keys',
  REPLAY_AUDIT_DEAD_LETTER: 'replay-audit-dead-letter',
  CLOSE_EXPIRED_POSTINGS: 'close-expired-postings',
  PRUNE_EXPIRED_APPLICANT_TOKENS: 'prune-expired-applicant-tokens',
  PRUNE_DRAFT_APPLICATIONS: 'prune-draft-applications',
  PRUNE_WEBHOOK_DELIVERIES: 'prune-webhook-deliveries',
  PROBE_WEBHOOK_CIRCUITS: 'probe-webhook-circuits',
} as const;

export type MaintenanceJobNameCode = (typeof MaintenanceJobName)[keyof typeof MaintenanceJobName];

export const MAIL_WORKER_CONCURRENCY = 5;
export const AUDIT_WORKER_CONCURRENCY = 1;
export const MAINTENANCE_WORKER_CONCURRENCY = 1;

export const QUEUE_METRICS_POLL_INTERVAL_MS = 30_000;

export const PRUNE_EXPIRED_SESSIONS_EVERY_MS = 15 * 60 * 1000;
export const PRUNE_REFRESH_FAMILIES_EVERY_MS = 60 * 60 * 1000;
export const PRUNE_ORPHANED_CRYPTO_EVERY_MS = 30 * 60 * 1000;
export const REPLAY_DEAD_LETTER_EVERY_MS = 60 * 60 * 1000;

export const CLOSE_EXPIRED_POSTINGS_EVERY_MS = 15 * 60 * 1000;
export const PRUNE_APPLICANT_TOKENS_EVERY_MS = 60 * 60 * 1000;
export const PRUNE_DRAFT_APPLICATIONS_EVERY_MS = 6 * 60 * 60 * 1000;

export const WEBHOOK_WORKER_CONCURRENCY = 3;
export const PRUNE_WEBHOOK_DELIVERIES_EVERY_MS = 24 * 60 * 60 * 1000;
export const PROBE_WEBHOOK_CIRCUITS_EVERY_MS = 5 * 60 * 1000;

const REMOVE_ON_COMPLETE_AGE_SECONDS = 3_600;
const REMOVE_ON_COMPLETE_COUNT = 1_000;
const REMOVE_ON_FAIL_AGE_SECONDS = 86_400;
const REMOVE_ON_FAIL_COUNT = 5_000;
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_DELAY_MS = 1_000;

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: DEFAULT_ATTEMPTS,
  backoff: { type: 'exponential', delay: DEFAULT_BACKOFF_DELAY_MS },
  removeOnComplete: {
    age: REMOVE_ON_COMPLETE_AGE_SECONDS,
    count: REMOVE_ON_COMPLETE_COUNT,
  },
  removeOnFail: {
    age: REMOVE_ON_FAIL_AGE_SECONDS,
    count: REMOVE_ON_FAIL_COUNT,
  },
};

export function buildBullPrefix(region: string): string {
  return `as:${region}:bull`;
}

export function buildAuditDeadLetterKey(region: string): string {
  return `as:${region}:audit:dead-letter`;
}

export function buildSessionScanPattern(region: string): string {
  return `as:${region}:session:*`;
}

export function buildCryptoScanPattern(region: string): string {
  return `as:${region}:crypto:*`;
}
