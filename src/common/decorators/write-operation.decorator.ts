/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route as a write operation so WriteRegionGuard can reject it in read-only regions.
 */
import { SetMetadata } from '@nestjs/common';

export const WRITE_OPERATION_KEY = 'isWriteOperation';

export const WriteOperation = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(WRITE_OPERATION_KEY, true);
