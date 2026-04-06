/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the password-changed confirmation mail job.
 */
import { IsEmail, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;
const MAX_IP_HASH_LENGTH = 128;

export class PasswordChangedInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsISO8601()
  readonly changedAt!: string;

  @IsString()
  @MaxLength(MAX_IP_HASH_LENGTH)
  readonly ipHash!: string;
}
