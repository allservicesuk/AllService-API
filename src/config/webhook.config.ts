/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Webhook module config namespace for signing, retry backoff, circuit breaker thresholds, and delivery retention.
 */
import { registerAs } from '@nestjs/config';

export interface WebhookConfig {
  readonly signingAlgorithm: string;
  readonly deliveryTimeoutMs: number;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
  readonly retryMaxDelayMs: number;
  readonly circuitBreakerThreshold: number;
  readonly circuitBreakerResetMs: number;
  readonly retentionDays: number;
  readonly workerConcurrency: number;
  readonly maxPayloadBytes: number;
}

export default registerAs('webhook', (): WebhookConfig => {
  const timeout = process.env['WEBHOOK_DELIVERY_TIMEOUT_MS'];
  const maxRetries = process.env['WEBHOOK_MAX_RETRIES'];
  const retryBase = process.env['WEBHOOK_RETRY_BASE_DELAY_MS'];
  const retryMax = process.env['WEBHOOK_RETRY_MAX_DELAY_MS'];
  const cbThreshold = process.env['WEBHOOK_CIRCUIT_BREAKER_THRESHOLD'];
  const cbReset = process.env['WEBHOOK_CIRCUIT_BREAKER_RESET_MS'];
  const retention = process.env['WEBHOOK_RETENTION_DAYS'];
  const concurrency = process.env['WEBHOOK_WORKER_CONCURRENCY'];
  const maxPayload = process.env['WEBHOOK_MAX_PAYLOAD_BYTES'];
  return {
    signingAlgorithm: 'sha256',
    deliveryTimeoutMs: timeout ? parseInt(timeout, 10) : 30_000,
    maxRetries: maxRetries ? parseInt(maxRetries, 10) : 5,
    retryBaseDelayMs: retryBase ? parseInt(retryBase, 10) : 10_000,
    retryMaxDelayMs: retryMax ? parseInt(retryMax, 10) : 3_600_000,
    circuitBreakerThreshold: cbThreshold ? parseInt(cbThreshold, 10) : 10,
    circuitBreakerResetMs: cbReset ? parseInt(cbReset, 10) : 300_000,
    retentionDays: retention ? parseInt(retention, 10) : 90,
    workerConcurrency: concurrency ? parseInt(concurrency, 10) : 3,
    maxPayloadBytes: maxPayload ? parseInt(maxPayload, 10) : 65_536,
  };
});
