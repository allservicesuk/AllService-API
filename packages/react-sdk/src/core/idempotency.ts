/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * UUID-based idempotency key generator for mutation requests.
 */

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
