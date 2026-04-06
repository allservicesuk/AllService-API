/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Exponential backoff retry with full jitter and retryAfter support.
 */
import { DEFAULT_RETRY_CONFIG } from './constants';
import { AllServicesApiError } from './errors';

export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly retryableStatusCodes: readonly number[];
}

function computeDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  return Math.random() * cappedDelay;
}

function isRetryable(error: unknown, config: RetryConfig): boolean {
  if (error instanceof AllServicesApiError) {
    return config.retryableStatusCodes.includes(error.statusCode);
  }
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

function getRetryAfterMs(error: unknown): number | null {
  if (error instanceof AllServicesApiError && error.retryAfter !== undefined) {
    return error.retryAfter * 1000;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries || !isRetryable(error, config)) {
        throw error;
      }

      const retryAfterMs = getRetryAfterMs(error);
      const delay =
        retryAfterMs !== null
          ? retryAfterMs
          : computeDelay(attempt, config);

      await sleep(delay);
    }
  }

  throw lastError;
}
