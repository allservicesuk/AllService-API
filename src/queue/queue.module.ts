/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global queue module that registers BullMQ queues, processors, event listeners, and metrics poller.
 */
import { BullModule } from '@nestjs/bullmq';
import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  type OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Redis } from 'ioredis';

import regionConfig from '@config/region.config';

import { MailModule } from '../mail/mail.module';
import { CareersModule } from '../modules/careers/careers.module';
import { WebhookModule } from '../modules/webhook/webhook.module';

import { bullConnectionProvider } from './queue-connection.provider';
import {
  AuditQueueEventsListener,
  MailQueueEventsListener,
  MaintenanceQueueEventsListener,
  WebhookQueueEventsListener,
} from './queue-events.listener';
import { QueueMetricsService } from './queue-metrics.service';
import { AuditProcessor } from './processors/audit.processor';
import { MailProcessor } from './processors/mail.processor';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { DEFAULT_JOB_OPTIONS, QueueName, buildBullPrefix } from './queue.constants';
import { BULL_CONNECTION } from './queue.tokens';

@Injectable()
class BullConnectionLifecycle implements OnModuleDestroy {
  private readonly logger = new Logger(BullConnectionLifecycle.name);

  constructor(@Inject(BULL_CONNECTION) private readonly connection: Redis) {}

  async onModuleDestroy(): Promise<void> {
    if (this.connection.status === 'end' || this.connection.status === 'close') {
      return;
    }
    await this.connection.quit();
    this.logger.log('queue.connection.closed');
  }
}

@Module({
  providers: [bullConnectionProvider],
  exports: [BULL_CONNECTION],
})
class QueueConnectionModule {}

@Global()
@Module({
  imports: [
    QueueConnectionModule,
    BullModule.forRootAsync({
      imports: [QueueConnectionModule],
      useFactory: (connection: Redis, region: ConfigType<typeof regionConfig>) => ({
        connection,
        prefix: buildBullPrefix(region.region),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      inject: [BULL_CONNECTION, regionConfig.KEY],
    }),
    BullModule.registerQueue(
      { name: QueueName.MAIL },
      { name: QueueName.AUDIT },
      { name: QueueName.MAINTENANCE },
      { name: QueueName.WEBHOOK },
    ),
    MailModule,
    forwardRef(() => CareersModule),
    forwardRef(() => WebhookModule),
  ],
  providers: [
    BullConnectionLifecycle,
    MailProcessor,
    AuditProcessor,
    MaintenanceProcessor,
    MailQueueEventsListener,
    AuditQueueEventsListener,
    MaintenanceQueueEventsListener,
    WebhookQueueEventsListener,
    WebhookProcessor,
    QueueMetricsService,
  ],
  exports: [BullModule, QueueConnectionModule],
})
export class QueueModule {}
