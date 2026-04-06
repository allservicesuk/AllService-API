/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Time-sortable UUID v7 generator used for all database primary keys.
 */
import { randomBytes, randomUUID } from 'node:crypto';

export function generateId(): string {
  const timestampMs = BigInt(Date.now());
  const timestampHex = timestampMs.toString(16).padStart(12, '0');
  const randBytes = randomBytes(10);

  const rawBytes = Buffer.concat([Buffer.from(timestampHex, 'hex'), randBytes]);

  rawBytes[6] = ((rawBytes[6] ?? 0) & 0x0f) | 0x70;
  rawBytes[8] = ((rawBytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = rawBytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function generateV4(): string {
  return randomUUID();
}
