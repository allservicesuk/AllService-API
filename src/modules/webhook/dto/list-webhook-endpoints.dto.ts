/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Query DTO for listing webhook endpoints with pagination and optional status filter.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const ALLOWED_STATUSES = ['ACTIVE', 'PAUSED', 'DISABLED'] as const;
const ALLOWED_SORT_ORDER = ['asc', 'desc'] as const;

export class ListWebhookEndpointsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  readonly pageSize: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ enum: ALLOWED_STATUSES })
  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  readonly status?: (typeof ALLOWED_STATUSES)[number];

  @ApiPropertyOptional({ enum: ALLOWED_SORT_ORDER, default: 'desc' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDER)
  readonly sortOrder?: (typeof ALLOWED_SORT_ORDER)[number] = 'desc';
}
