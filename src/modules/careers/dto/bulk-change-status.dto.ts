/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for changing multiple applications' status in a single request.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const MAX_NOTES = 5000;
const MAX_BULK_SIZE = 50;

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

export class BulkChangeStatusDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_SIZE)
  @IsUUID('4', { each: true })
  readonly applicationIds!: string[];

  @ApiProperty({ enum: ALLOWED_STATUSES })
  @IsIn(ALLOWED_STATUSES)
  readonly status!: (typeof ALLOWED_STATUSES)[number];

  @ApiPropertyOptional({ maxLength: MAX_NOTES })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES)
  readonly notes?: string;
}
