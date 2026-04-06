/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Abstract Prisma client base that wires query-event logging and connect/disconnect lifecycle.
 */
import type { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type PrismaLogConfig = [
  { emit: 'event'; level: 'query' },
  { emit: 'event'; level: 'warn' },
  { emit: 'event'; level: 'error' },
];

export type PrismaBaseClientOptions = {
  log: PrismaLogConfig;
  datasourceUrl: string;
};

export const SLOW_QUERY_THRESHOLD_MS_PROD = 100;

export abstract class PrismaBaseService
  extends PrismaClient<PrismaBaseClientOptions>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger;
  private readonly slowQueryThresholdMs: number;
  private readonly isDevelopment: boolean;

  protected constructor(datasourceUrl: string, isDevelopment: boolean, logger: Logger) {
    super({
      datasourceUrl,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
    this.logger = logger;
    this.isDevelopment = isDevelopment;
    this.slowQueryThresholdMs = isDevelopment ? 0 : SLOW_QUERY_THRESHOLD_MS_PROD;
    this.registerEventHandlers();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('disconnected');
  }

  private registerEventHandlers(): void {
    this.$on('query', (event) => {
      if (event.duration < this.slowQueryThresholdMs) {
        return;
      }
      if (this.isDevelopment) {
        this.logger.debug(`[${event.duration}ms] ${event.query}`);
        return;
      }
      this.logger.warn(`slow query [${event.duration}ms] ${event.query}`);
    });
    this.$on('warn', (event) => {
      this.logger.warn(event.message);
    });
    this.$on('error', (event) => {
      this.logger.error(event.message);
    });
  }
}
