/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin-only user mutation DTO requiring at least one provided field.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { Role } from '@common/constants';
import { AtLeastOneField } from '@common/validators/at-least-one-field.validator';

const NAME_MAX = 100;
const ALLOWED_ROLES = [Role.USER, Role.TENANT_ADMIN, Role.ADMIN] as const;

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ maxLength: NAME_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly firstName?: string;

  @ApiPropertyOptional({ maxLength: NAME_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly lastName?: string;

  @ApiPropertyOptional({ enum: ALLOWED_ROLES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALLOWED_ROLES, { each: true })
  readonly roles?: readonly string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly emailVerified?: boolean;

  @AtLeastOneField(['firstName', 'lastName', 'roles', 'isActive', 'tenantId', 'emailVerified'])
  readonly _atLeastOne?: never;
}
