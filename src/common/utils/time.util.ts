/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Time helpers for UTC now, duration-string parsing, and expiration checks.
 */
const DURATION_REGEX = /^(\d+)(ms|s|m|h|d|w)$/;
const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

export function nowUtc(): Date {
  return new Date();
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function parseDuration(duration: string): number {
  const match = DURATION_REGEX.exec(duration.trim());
  if (!match) {
    throw new Error(`parseDuration: invalid duration "${duration}"`);
  }
  const amount = parseInt(match[1] ?? '0', 10);
  const unit = match[2] ?? 'ms';
  const multiplier = DURATION_MULTIPLIERS[unit];
  if (multiplier === undefined) {
    throw new Error(`parseDuration: unknown unit "${unit}"`);
  }
  return amount * multiplier;
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
