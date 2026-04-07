/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Input DTO for updating an existing webhook endpoint; all fields are optional partial updates.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_EVENT_TYPES = 50;
const ALLOWED_STATUSES = ['ACTIVE', 'PAUSED', 'DISABLED'] as const;

export class UpdateWebhookEndpointDto {
  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly url?: string;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVENT_TYPES)
  @IsString({ each: true })
  readonly eventTypes?: string[];

  @ApiPropertyOptional({ enum: ALLOWED_STATUSES })
  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  readonly status?: (typeof ALLOWED_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, unknown>;
}
