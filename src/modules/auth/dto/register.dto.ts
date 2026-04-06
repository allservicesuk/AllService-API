/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Public registration DTO capturing email and password with optional profile names.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const EMAIL_MAX = 255;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const NAME_MAX = 100;

export class RegisterDto {
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
}
