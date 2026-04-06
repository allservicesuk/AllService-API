/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin list query DTO with pagination, filters, and sort controls.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Role } from '@common/constants';

const PAGE_DEFAULT = 1;
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;
const SEARCH_MAX = 255;
const ALLOWED_ROLES = [Role.USER, Role.TENANT_ADMIN, Role.ADMIN] as const;
const ALLOWED_SORT_BY = ['createdAt', 'updatedAt', 'email', 'lastLoginAt'] as const;
const ALLOWED_SORT_ORDER = ['asc', 'desc'] as const;

export type ListUsersSortBy = (typeof ALLOWED_SORT_BY)[number];
export type ListUsersSortOrder = (typeof ALLOWED_SORT_ORDER)[number];

function toBoolean(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'true' || normalised === '1') {
      return true;
    }
    if (normalised === 'false' || normalised === '0') {
      return false;
    }
  }
  return value;
}

export class ListUsersDto {
  @ApiPropertyOptional({ minimum: 1, default: PAGE_DEFAULT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = PAGE_DEFAULT;

  @ApiPropertyOptional({ minimum: 1, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_DEFAULT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGE_SIZE_MAX)
  readonly pageSize: number = PAGE_SIZE_DEFAULT;

  @ApiPropertyOptional({ maxLength: SEARCH_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly search?: string;

  @ApiPropertyOptional({ enum: ALLOWED_ROLES })
  @IsOptional()
  @IsIn(ALLOWED_ROLES)
  readonly role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => toBoolean(value))
  @IsBoolean()
  readonly isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => toBoolean(value))
  @IsBoolean()
  readonly isLocked?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly tenantId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => toBoolean(value))
  @IsBoolean()
  readonly includeDeleted: boolean = false;

  @ApiPropertyOptional({ enum: ALLOWED_SORT_BY, default: 'createdAt' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_BY)
  readonly sortBy: ListUsersSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: ALLOWED_SORT_ORDER, default: 'desc' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDER)
  readonly sortOrder: ListUsersSortOrder = 'desc';
}
