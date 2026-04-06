/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Query DTO for listing applications with pagination and filtering (admin endpoint).
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 255;

const ALLOWED_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;
const ALLOWED_SORT_BY = ['createdAt', 'applicantName', 'status'] as const;
const ALLOWED_SORT_ORDER = ['asc', 'desc'] as const;

type ListApplicationsSortBy = (typeof ALLOWED_SORT_BY)[number];
type ListApplicationsSortOrder = (typeof ALLOWED_SORT_ORDER)[number];

export class ListApplicationsDto {
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

  @ApiPropertyOptional({ maxLength: MAX_SEARCH_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SEARCH_LENGTH)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly search?: string;

  @ApiPropertyOptional({ enum: ALLOWED_STATUSES })
  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  readonly status?: (typeof ALLOWED_STATUSES)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly jobPostingId?: string;

  @ApiPropertyOptional({ enum: ALLOWED_SORT_BY, default: 'createdAt' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_BY)
  readonly sortBy: ListApplicationsSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: ALLOWED_SORT_ORDER, default: 'desc' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDER)
  readonly sortOrder: ListApplicationsSortOrder = 'desc';
}
