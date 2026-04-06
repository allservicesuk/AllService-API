/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the application email-verification code mail job.
 */
import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

const CODE_LENGTH = 6;
const MAX_NAME_LENGTH = 200;

export class ApplicationVerifyInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  @Length(CODE_LENGTH, CODE_LENGTH)
  readonly code!: string;

  @IsString()
  readonly jobTitle!: string;
}
