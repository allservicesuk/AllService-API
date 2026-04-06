/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin-only user creation DTO accepting plaintext password that is hashed server-side.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Role } from '@common/constants';

const EMAIL_MAX = 255;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const NAME_MAX = 100;
const ALLOWED_ROLES = [Role.USER, Role.TENANT_ADMIN, Role.ADMIN] as const;

export class AdminCreateUserDto {
  @ApiProperty({ maxLength: EMAIL_MAX })
  @IsEmail()
  @MaxLength(EMAIL_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email!: string;

  @ApiProperty({ minLength: PASSWORD_MIN, maxLength: PASSWORD_MAX })
  @IsString()
  @MinLength(PASSWORD_MIN)
  @MaxLength(PASSWORD_MAX)
  readonly password!: string;

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

  @ApiProperty({ enum: ALLOWED_ROLES, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALLOWED_ROLES, { each: true })
  readonly roles!: readonly string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly tenantId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  readonly emailVerified?: boolean;
}
