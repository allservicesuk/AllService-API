/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global region module exporting RegionService and RegionHealthIndicator.
 */
import { Global, Module } from '@nestjs/common';

import { RegionHealthIndicator } from './region.health';
import { RegionService } from './region.service';

@Global()
@Module({
  providers: [RegionService, RegionHealthIndicator],
  exports: [RegionService, RegionHealthIndicator],
})
export class RegionModule {}
