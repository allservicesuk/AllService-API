/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the account-locked notification mail job.
 */
import { IsEmail, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;
const MAX_REASON_LENGTH = 512;

export class AccountLockedInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  @MaxLength(MAX_REASON_LENGTH)
  readonly reason!: string;

  @IsOptional()
  @IsISO8601()
  readonly lockedUntil?: string;
}
