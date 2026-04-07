/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Response DTO for webhook endpoint data returned to API consumers.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookEndpointResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly url!: string;

  @ApiPropertyOptional()
  readonly description!: string | null;

  @ApiProperty({ type: [String] })
  readonly eventTypes!: string[];

  @ApiProperty()
  readonly status!: string;

  @ApiPropertyOptional()
  readonly metadata!: unknown;

  @ApiProperty({ format: 'uuid' })
  readonly createdBy!: string;

  @ApiProperty()
  readonly failureCount!: number;

  @ApiPropertyOptional()
  readonly lastFailedAt!: string | null;

  @ApiProperty()
  readonly circuitState!: string;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;

  @ApiPropertyOptional()
  readonly secret?: string;
}

export class WebhookDeliveryResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'uuid' })
  readonly eventId!: string;

  @ApiProperty()
  readonly attemptNumber!: number;

  @ApiProperty()
  readonly status!: string;

  @ApiPropertyOptional()
  readonly httpStatusCode!: number | null;

  @ApiPropertyOptional()
  readonly latencyMs!: number | null;

  @ApiPropertyOptional()
  readonly errorMessage!: string | null;

  @ApiPropertyOptional()
  readonly nextRetryAt!: string | null;

  @ApiProperty()
  readonly createdAt!: string;
}

export class WebhookEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'uuid' })
  readonly endpointId!: string;

  @ApiProperty()
  readonly eventType!: string;

  @ApiProperty()
  readonly payload!: unknown;

  @ApiProperty()
  readonly idempotencyKey!: string;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiPropertyOptional({ type: [WebhookDeliveryResponseDto] })
  readonly deliveries?: WebhookDeliveryResponseDto[];
}
