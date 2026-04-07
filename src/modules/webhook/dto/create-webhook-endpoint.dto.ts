/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Input DTO for creating a new webhook endpoint with URL, description, event types, and optional metadata.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_EVENT_TYPES = 50;

export class CreateWebhookEndpointDto {
  @ApiProperty({ maxLength: 2048 })
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly url!: string;

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVENT_TYPES)
  @IsString({ each: true })
  readonly eventTypes!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, unknown>;
}
