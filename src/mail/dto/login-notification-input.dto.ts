/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the new-device login notification mail job.
 */
import { IsEmail, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;
const MAX_DEVICE_LENGTH = 512;
const MAX_IP_HASH_LENGTH = 128;
const MAX_CITY_LENGTH = 120;
const MAX_COUNTRY_LENGTH = 2;

export class LoginNotificationInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  @MaxLength(MAX_DEVICE_LENGTH)
  readonly device!: string;

  @IsString()
  @MaxLength(MAX_IP_HASH_LENGTH)
  readonly ipHash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_CITY_LENGTH)
  readonly city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_COUNTRY_LENGTH)
  readonly country?: string;

  @IsISO8601()
  readonly loginAt!: string;
}
