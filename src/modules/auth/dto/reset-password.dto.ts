/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO for completing a password reset using the emailed single-use token.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

const TOKEN_MIN = 64;
const TOKEN_MAX = 256;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

export class ResetPasswordDto {
  @ApiProperty({ minLength: TOKEN_MIN, maxLength: TOKEN_MAX })
  @IsString()
  @MinLength(TOKEN_MIN)
  @MaxLength(TOKEN_MAX)
  readonly token!: string;

  @ApiProperty({ minLength: PASSWORD_MIN, maxLength: PASSWORD_MAX })
  @IsString()
  @MinLength(PASSWORD_MIN)
  @MaxLength(PASSWORD_MAX)
  readonly newPassword!: string;
}
