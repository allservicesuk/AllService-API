/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO wrapping an opaque refresh token submitted by desktop clients to rotate access tokens.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

const REFRESH_TOKEN_MIN = 64;
const REFRESH_TOKEN_MAX = 128;

export class RefreshTokenDto {
  @ApiProperty({ minLength: REFRESH_TOKEN_MIN, maxLength: REFRESH_TOKEN_MAX })
  @IsString()
  @MinLength(REFRESH_TOKEN_MIN)
  @MaxLength(REFRESH_TOKEN_MAX)
  readonly refreshToken!: string;
}
