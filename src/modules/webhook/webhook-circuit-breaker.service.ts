/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Circuit breaker for webhook endpoints that opens after consecutive failures and auto-probes for recovery.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { PrismaClient, WebhookEndpoint } from '@prisma/client';

import webhookConfig from '@config/webhook.config';

import { PRISMA_READ } from '../../database/database.tokens';
import { PRISMA_WRITE } from '../../database/database.tokens';

import { CircuitState, type CircuitStateCode } from './webhook.constants';

@Injectable()
export class WebhookCircuitBreakerService {
  private readonly logger = new Logger(WebhookCircuitBreakerService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    @Inject(webhookConfig.KEY) private readonly config: ConfigType<typeof webhookConfig>,
  ) {}

  shouldDeliver(endpoint: WebhookEndpoint): boolean {
    const state = endpoint.circuitState as CircuitStateCode;
    if (state === CircuitState.CLOSED) {
      return true;
    }
    if (state === CircuitState.HALF_OPEN) {
      return true;
    }
    return false;
  }

  async recordSuccess(endpointId: string): Promise<void> {
    await this.prismaWrite.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        failureCount: 0,
        circuitState: CircuitState.CLOSED,
        circuitOpenedAt: null,
        lastFailedAt: null,
      },
    });
  }

  async recordFailure(endpointId: string): Promise<void> {
    const endpoint = await this.prismaWrite.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        failureCount: { increment: 1 },
        lastFailedAt: new Date(),
      },
    });

    if (
      endpoint.failureCount >= this.config.circuitBreakerThreshold &&
      endpoint.circuitState !== CircuitState.OPEN
    ) {
      await this.prismaWrite.webhookEndpoint.update({
        where: { id: endpointId },
        data: {
          circuitState: CircuitState.OPEN,
          circuitOpenedAt: new Date(),
          status: 'PAUSED',
        },
      });
      this.logger.warn(
        `webhook.circuit.opened endpointId=${endpointId} failures=${endpoint.failureCount}`,
      );
    }
  }

  async recordHalfOpenFailure(endpointId: string): Promise<void> {
    await this.prismaWrite.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        circuitState: CircuitState.OPEN,
        circuitOpenedAt: new Date(),
        lastFailedAt: new Date(),
        failureCount: { increment: 1 },
      },
    });
    this.logger.warn(`webhook.circuit.half_open_failed endpointId=${endpointId}`);
  }

  async probeOpenCircuits(): Promise<number> {
    const cutoff = new Date(Date.now() - this.config.circuitBreakerResetMs);
    const result = await this.prismaWrite.webhookEndpoint.updateMany({
      where: {
        circuitState: CircuitState.OPEN,
        circuitOpenedAt: { lt: cutoff },
        status: { not: 'DISABLED' },
      },
      data: {
        circuitState: CircuitState.HALF_OPEN,
        status: 'ACTIVE',
      },
    });

    if (result.count > 0) {
      this.logger.log(`webhook.circuit.half_open count=${result.count}`);
    }
    return result.count;
  }
}
