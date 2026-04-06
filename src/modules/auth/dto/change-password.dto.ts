/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO for authenticated users to change their password by verifying the current one.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  readonly currentPassword!: string;

  @ApiProperty({ minLength: PASSWORD_MIN, maxLength: PASSWORD_MAX })
  @IsString()
  @MinLength(PASSWORD_MIN)
  @MaxLength(PASSWORD_MAX)
  readonly newPassword!: string;
}
