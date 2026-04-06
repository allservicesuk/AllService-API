/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Login DTO accepting email, password, and optional TOTP code for accounts with MFA enabled.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

const PASSWORD_MIN = 1;
const MFA_CODE_LENGTH = 6;
const MFA_CODE_PATTERN = /^[0-9]{6}$/;

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(PASSWORD_MIN)
  readonly password!: string;

  @ApiPropertyOptional({ minLength: MFA_CODE_LENGTH, maxLength: MFA_CODE_LENGTH })
  @IsOptional()
  @IsString()
  @Length(MFA_CODE_LENGTH, MFA_CODE_LENGTH)
  @Matches(MFA_CODE_PATTERN, { message: 'mfaCode must be numeric' })
  readonly mfaCode?: string;
}
