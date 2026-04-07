/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin controller for managing webhook endpoints, viewing deliveries, and triggering test events.
 */
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RequirePermission } from '@common/decorators/permissions.decorator';
import { WriteOperation } from '@common/decorators/write-operation.decorator';
import { ReadOnlySafe } from '@common/decorators/read-only-safe.decorator';
import { Permission } from '@common/constants/permissions';
import { ErrorCode } from '@common/constants/error-codes';
import type { AuthenticatedUser } from '@common/interfaces/request-with-user.interface';

import { QueueName } from '../../queue/queue.constants';

import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { UpdateWebhookEndpointDto } from './dto/update-webhook-endpoint.dto';
import { ListWebhookEndpointsDto } from './dto/list-webhook-endpoints.dto';
import { ListWebhookDeliveriesDto } from './dto/list-webhook-deliveries.dto';
import {
  WebhookDeliveryResponseDto,
  WebhookEndpointResponseDto,
  WebhookEventResponseDto,
} from './dto/webhook-endpoint-response.dto';
import { WebhookMapper } from './webhook.mapper';
import { WebhookService } from './webhook.service';
import { ALL_WEBHOOK_EVENT_TYPES, WebhookJobName, type WebhookEventTypeCode } from './webhook.constants';

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller({ path: 'webhooks', version: '1' })
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly mapper: WebhookMapper,
    @InjectQueue(QueueName.WEBHOOK) private readonly webhookQueue: Queue,
  ) {}

  @Post()
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Endpoint created' })
  async createEndpoint(
    @Body() dto: CreateWebhookEndpointDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WebhookEndpointResponseDto> {
    const result = await this.webhookService.createEndpoint(dto, user.id);
    return this.mapper.toEndpointResponse(result, result.rawSecret);
  }

  @Post('deliveries/:deliveryId/retry')
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed webhook delivery' })
  async retryDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<WebhookDeliveryResponseDto> {
    const delivery = await this.webhookService.findDeliveryById(deliveryId);

    if (delivery.status !== 'FAILED') {
      throw new ConflictException({
        code: ErrorCode.WEBHOOK_DELIVERY_NOT_RETRYABLE,
        message: 'Only failed deliveries can be retried',
      });
    }

    const event = await this.webhookService.findEventById(delivery.eventId);

    await this.webhookQueue.add(
      WebhookJobName.RETRY,
      {
        eventId: event.id,
        endpointId: event.endpointId,
        attemptNumber: delivery.attemptNumber + 1,
      },
      { attempts: 1 },
    );

    const updated = await this.webhookService.findDeliveryById(deliveryId);
    return this.mapper.toDeliveryResponse(updated);
  }

  @Get('event-types')
  @ReadOnlySafe()
  @RequirePermission(Permission.WEBHOOK_READ)
  @ApiOperation({ summary: 'List all available webhook event types' })
  async listEventTypes(): Promise<{ eventTypes: readonly string[] }> {
    return { eventTypes: ALL_WEBHOOK_EVENT_TYPES };
  }

  @Get('events/:eventId')
  @ReadOnlySafe()
  @RequirePermission(Permission.WEBHOOK_READ)
  @ApiOperation({ summary: 'Get a webhook event by ID' })
  async getEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<WebhookEventResponseDto> {
    const event = await this.webhookService.findEventById(eventId);
    return this.mapper.toEventResponse(event);
  }

  @Get()
  @ReadOnlySafe()
  @RequirePermission(Permission.WEBHOOK_READ)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List webhook endpoints' })
  async listEndpoints(
    @Query() dto: ListWebhookEndpointsDto,
  ): Promise<{ data: WebhookEndpointResponseDto[]; total: number }> {
    const result = await this.webhookService.listEndpoints(dto);
    return {
      data: this.mapper.toEndpointResponseList(result.data),
      total: result.total,
    };
  }

  @Patch(':id')
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_WRITE)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  async updateEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookEndpointDto,
  ): Promise<WebhookEndpointResponseDto> {
    const endpoint = await this.webhookService.updateEndpoint(id, dto);
    return this.mapper.toEndpointResponse(endpoint);
  }

  @Delete(':id')
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  @ApiResponse({ status: 204, description: 'Endpoint deleted' })
  async deleteEndpoint(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.webhookService.deleteEndpoint(id);
  }

  @Get(':id')
  @ReadOnlySafe()
  @RequirePermission(Permission.WEBHOOK_READ)
  @ApiOperation({ summary: 'Get a webhook endpoint by ID' })
  async getEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WebhookEndpointResponseDto> {
    const endpoint = await this.webhookService.findEndpointById(id);
    return this.mapper.toEndpointResponse(endpoint);
  }

  @Post(':id/rotate-secret')
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate webhook endpoint signing secret' })
  async rotateSecret(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WebhookEndpointResponseDto> {
    const result = await this.webhookService.rotateSecret(id);
    return this.mapper.toEndpointResponse(result.endpoint, result.rawSecret);
  }

  @Post(':id/test')
  @WriteOperation()
  @RequirePermission(Permission.WEBHOOK_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test event to a webhook endpoint' })
  async testEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WebhookEventResponseDto> {
    const endpoint = await this.webhookService.findEndpointById(id);

    if (endpoint.status === 'DISABLED') {
      throw new ConflictException({
        code: ErrorCode.WEBHOOK_ENDPOINT_DISABLED,
        message: 'Cannot test a disabled endpoint',
      });
    }

    const eventType = (endpoint.eventTypes[0] ?? 'career.application.submitted') as WebhookEventTypeCode;

    const testPayload: Record<string, unknown> = {
      test: true,
      message: 'This is a test webhook event',
      triggeredBy: user.id,
      timestamp: new Date().toISOString(),
    };

    const event = await this.webhookService.createEvent(
      endpoint.id,
      eventType,
      testPayload,
    );

    await this.webhookQueue.add(
      WebhookJobName.DELIVER,
      { eventId: event.id, endpointId: endpoint.id, attemptNumber: 1 },
      { attempts: 1 },
    );

    const fullEvent = await this.webhookService.findEventById(event.id);
    return this.mapper.toEventResponse(fullEvent);
  }

  @Get(':id/deliveries')
  @ReadOnlySafe()
  @RequirePermission(Permission.WEBHOOK_READ)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List deliveries for a webhook endpoint' })
  async listDeliveries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: ListWebhookDeliveriesDto,
  ): Promise<{ data: WebhookDeliveryResponseDto[]; total: number }> {
    await this.webhookService.findEndpointById(id);
    const dtoWithEndpoint = { ...dto, endpointId: id };
    const result = await this.webhookService.listDeliveries(dtoWithEndpoint);
    return {
      data: this.mapper.toDeliveryResponseList(result.data),
      total: result.total,
    };
  }
}
