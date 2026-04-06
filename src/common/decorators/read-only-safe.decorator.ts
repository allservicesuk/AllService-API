/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route as safe to serve from a read-only region for routing and documentation purposes.
 */
import { SetMetadata } from '@nestjs/common';

export const READ_ONLY_SAFE_KEY = 'isReadOnlySafe';

export const ReadOnlySafe = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(READ_ONLY_SAFE_KEY, true);
