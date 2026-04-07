/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Webhook CRUD service for managing endpoints, creating events, and querying deliveries.
 */
import { randomUUID } from 'crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type {
  PrismaClient,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
} from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import webhookConfig from '@config/webhook.config';

import { PRISMA_READ } from '../../database/database.tokens';
import { PRISMA_WRITE } from '../../database/database.tokens';

import { WebhookSigningService } from './webhook-signing.service';
import {
  ALL_WEBHOOK_EVENT_TYPES,
  CircuitState,
  type WebhookEventTypeCode,
} from './webhook.constants';
import type { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import type { UpdateWebhookEndpointDto } from './dto/update-webhook-endpoint.dto';
import type { ListWebhookEndpointsDto } from './dto/list-webhook-endpoints.dto';
import type { ListWebhookDeliveriesDto } from './dto/list-webhook-deliveries.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    @Inject(webhookConfig.KEY) private readonly config: ConfigType<typeof webhookConfig>,
    private readonly signingService: WebhookSigningService,
  ) {}

  async createEndpoint(
    dto: CreateWebhookEndpointDto,
    createdBy: string,
  ): Promise<WebhookEndpoint & { rawSecret: string }> {
    this.validateEventTypes(dto.eventTypes);

    const rawSecret = this.signingService.generateSecret();

    const endpoint = await this.prismaWrite.webhookEndpoint.create({
      data: {
        url: dto.url,
        description: dto.description ?? null,
        secret: rawSecret,
        eventTypes: dto.eventTypes,
        status: 'ACTIVE',
        metadata: (dto.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        createdBy,
      },
    });

    this.logger.log(`webhook.endpoint.created id=${endpoint.id} url=${this.maskUrl(dto.url)}`);
    return { ...endpoint, rawSecret };
  }

  async updateEndpoint(
    id: string,
    dto: UpdateWebhookEndpointDto,
  ): Promise<WebhookEndpoint> {
    await this.findEndpointById(id);

    if (dto.eventTypes) {
      this.validateEventTypes(dto.eventTypes);
    }

    const data: Prisma.WebhookEndpointUpdateInput = {};
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.eventTypes !== undefined) data.eventTypes = dto.eventTypes;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.metadata !== undefined) data.metadata = (dto.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue;

    const updated = await this.prismaWrite.webhookEndpoint.update({
      where: { id },
      data,
    });

    this.logger.log(`webhook.endpoint.updated id=${id}`);
    return updated;
  }

  async deleteEndpoint(id: string): Promise<void> {
    await this.findEndpointById(id);
    await this.prismaWrite.webhookEndpoint.delete({ where: { id } });
    this.logger.log(`webhook.endpoint.deleted id=${id}`);
  }

  async findEndpointById(id: string): Promise<WebhookEndpoint> {
    const endpoint = await this.prismaRead.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint) {
      throw new NotFoundException({
        code: ErrorCode.WEBHOOK_NOT_FOUND,
        message: 'Webhook endpoint not found',
      });
    }
    return endpoint;
  }

  async listEndpoints(
    dto: ListWebhookEndpointsDto,
  ): Promise<{ data: WebhookEndpoint[]; total: number }> {
    const where: Prisma.WebhookEndpointWhereInput = {};
    if (dto.status) {
      where.status = dto.status;
    }
    const [data, total] = await Promise.all([
      this.prismaRead.webhookEndpoint.findMany({
        where,
        orderBy: { createdAt: dto.sortOrder ?? 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prismaRead.webhookEndpoint.count({ where }),
    ]);
    return { data, total };
  }

  async rotateSecret(id: string): Promise<{ endpoint: WebhookEndpoint; rawSecret: string }> {
    await this.findEndpointById(id);
    const rawSecret = this.signingService.generateSecret();
    const endpoint = await this.prismaWrite.webhookEndpoint.update({
      where: { id },
      data: { secret: rawSecret },
    });
    this.logger.log(`webhook.endpoint.secret_rotated id=${id}`);
    return { endpoint, rawSecret };
  }

  async createEvent(
    endpointId: string,
    eventType: WebhookEventTypeCode,
    payload: Record<string, unknown>,
  ): Promise<WebhookEvent> {
    const payloadJson = JSON.stringify(payload);
    if (Buffer.byteLength(payloadJson) > this.config.maxPayloadBytes) {
      throw new BadRequestException({
        code: ErrorCode.WEBHOOK_PAYLOAD_TOO_LARGE,
        message: 'Webhook payload exceeds size limit',
      });
    }

    const idempotencyKey = randomUUID();

    return this.prismaWrite.webhookEvent.create({
      data: {
        endpointId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
      },
    });
  }

  async findActiveEndpointsForEvent(
    eventType: WebhookEventTypeCode,
  ): Promise<WebhookEndpoint[]> {
    return this.prismaRead.webhookEndpoint.findMany({
      where: {
        status: 'ACTIVE',
        eventTypes: { has: eventType },
        circuitState: { not: CircuitState.OPEN },
      },
    });
  }

  async findEventById(id: string): Promise<WebhookEvent> {
    const event = await this.prismaRead.webhookEvent.findUnique({
      where: { id },
      include: { deliveries: { orderBy: { createdAt: 'desc' } } },
    });
    if (!event) {
      throw new NotFoundException({
        code: ErrorCode.WEBHOOK_EVENT_NOT_FOUND,
        message: 'Webhook event not found',
      });
    }
    return event;
  }

  async createDelivery(
    eventId: string,
    attemptNumber: number,
  ): Promise<WebhookDelivery> {
    return this.prismaWrite.webhookDelivery.create({
      data: {
        eventId,
        attemptNumber,
        status: 'PENDING',
      },
    });
  }

  async updateDelivery(
    id: string,
    data: Prisma.WebhookDeliveryUpdateInput,
  ): Promise<WebhookDelivery> {
    return this.prismaWrite.webhookDelivery.update({ where: { id }, data });
  }

  async findDeliveryById(id: string): Promise<WebhookDelivery> {
    const delivery = await this.prismaRead.webhookDelivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException({
        code: ErrorCode.WEBHOOK_DELIVERY_NOT_FOUND,
        message: 'Webhook delivery not found',
      });
    }
    return delivery;
  }

  async listDeliveries(
    dto: ListWebhookDeliveriesDto,
  ): Promise<{ data: WebhookDelivery[]; total: number }> {
    const where: Prisma.WebhookDeliveryWhereInput = {};
    if (dto.eventId) {
      where.eventId = dto.eventId;
    }
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.endpointId) {
      where.event = { endpointId: dto.endpointId };
    }
    const [data, total] = await Promise.all([
      this.prismaRead.webhookDelivery.findMany({
        where,
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prismaRead.webhookDelivery.count({ where }),
    ]);
    return { data, total };
  }

  async pruneOldDeliveries(): Promise<number> {
    const cutoff = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.prismaWrite.webhookDelivery.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(`webhook.deliveries.pruned count=${result.count}`);
    }
    return result.count;
  }

  async pruneOldEvents(): Promise<number> {
    const cutoff = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.prismaWrite.webhookEvent.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        deliveries: { none: {} },
      },
    });
    return result.count;
  }

  private validateEventTypes(types: string[]): void {
    const valid = new Set<string>(ALL_WEBHOOK_EVENT_TYPES);
    const invalid = types.filter((t) => !valid.has(t));
    if (invalid.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.WEBHOOK_INVALID_EVENT_TYPE,
        message: `Invalid event types: ${invalid.join(', ')}`,
      });
    }
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/***`;
    } catch {
      return '***';
    }
  }
}
