/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for changing an application's status through the pipeline.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const MAX_NOTES = 5000;

const ALLOWED_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
] as const;

export class ChangeStatusDto {
  @ApiProperty({ enum: ALLOWED_STATUSES })
  @IsIn(ALLOWED_STATUSES)
  readonly status!: (typeof ALLOWED_STATUSES)[number];

  @ApiPropertyOptional({ maxLength: MAX_NOTES })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES)
  readonly notes?: string;
}
