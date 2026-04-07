/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the application-access magic link re-send mail job.
 */
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;

export class ApplicationAccessInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  readonly jobTitle!: string;

  @IsUrl()
  readonly magicLinkUrl!: string;
}
