/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Exposes the Redis-backed throttler storage provider so it can be injected into ThrottlerModule.forRootAsync.
 */
import { Global, Module } from '@nestjs/common';

import { RedisThrottlerStorage } from './redis-throttler.storage';

@Global()
@Module({
  providers: [RedisThrottlerStorage],
  exports: [RedisThrottlerStorage],
})
export class ThrottlerStorageModule {}
