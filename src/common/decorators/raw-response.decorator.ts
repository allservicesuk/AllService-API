/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route to bypass the global TransformInterceptor so the handler return value is sent as-is.
 */
import { SetMetadata } from '@nestjs/common';

export const IS_RAW_RESPONSE_KEY = 'isRawResponse';

export const RawResponse = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_RAW_RESPONSE_KEY, true);
