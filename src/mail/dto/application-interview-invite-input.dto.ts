/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Payload contract for the interview-invite notification mail job.
 */
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const MAX_NAME_LENGTH = 200;

export class ApplicationInterviewInviteInput {
  @IsEmail()
  readonly to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NAME_LENGTH)
  readonly name?: string;

  @IsString()
  readonly jobTitle!: string;

  @IsOptional()
  @IsString()
  readonly notes?: string;

  @IsUrl()
  readonly magicLinkUrl!: string;
}
