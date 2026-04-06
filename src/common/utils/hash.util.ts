/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Cryptographic hash and secure-random helpers used across auth, audit, and session handling.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function generateSecureToken(bytes: number): string {
  if (bytes <= 0) {
    throw new Error('generateSecureToken: bytes must be > 0');
  }
  return randomBytes(bytes).toString('hex');
}

export function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
