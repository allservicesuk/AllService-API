/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route as requiring the X-Idempotency-Key header for safe replay handling.
 */
import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'isIdempotent';

export const Idempotent = (): ReturnType<typeof SetMetadata> => SetMetadata(IDEMPOTENT_KEY, true);
