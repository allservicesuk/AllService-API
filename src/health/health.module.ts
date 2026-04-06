/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Wires @nestjs/terminus and custom health indicators for the /health endpoint family.
 */
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ConnectionsHealthIndicator } from './connections.health';
import { HealthController } from './health.controller';
import { ObservabilityHealthIndicator } from './observability.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [ConnectionsHealthIndicator, ObservabilityHealthIndicator],
})
export class HealthModule {}
