/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the application-rejected notification mail job.
 */
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;

export class ApplicationRejectedInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  readonly jobTitle!: string;
}
