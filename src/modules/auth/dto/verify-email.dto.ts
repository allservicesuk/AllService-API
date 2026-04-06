/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO for exchanging an email-verification token for a verified account flag.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

const TOKEN_MIN = 64;
const TOKEN_MAX = 256;

export class VerifyEmailDto {
  @ApiProperty({ minLength: TOKEN_MIN, maxLength: TOKEN_MAX })
  @IsString()
  @MinLength(TOKEN_MIN)
  @MaxLength(TOKEN_MAX)
  readonly token!: string;
}
