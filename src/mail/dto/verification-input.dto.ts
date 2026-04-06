/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the email-verification mail job.
 */
import { IsEmail, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;
const MIN_TOKEN_LENGTH = 8;
const MAX_TOKEN_LENGTH = 256;

export class VerificationInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  @MinLength(MIN_TOKEN_LENGTH)
  @MaxLength(MAX_TOKEN_LENGTH)
  readonly token!: string;

  @IsISO8601()
  readonly expiresAt!: string;
}
