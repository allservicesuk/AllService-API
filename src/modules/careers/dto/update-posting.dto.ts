/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for updating an existing job posting (all fields optional).
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { CustomFieldDto } from './create-posting.dto';

const MAX_TITLE = 255;
const MAX_DEPARTMENT = 100;
const MAX_LOCATION = 200;
const MAX_DESCRIPTION = 50000;
const MAX_REQUIREMENTS = 50000;
const CURRENCY_LENGTH = 3;

export class UpdatePostingDto {
  @ApiPropertyOptional({ maxLength: MAX_TITLE })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TITLE)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly title?: string;

  @ApiPropertyOptional({ maxLength: MAX_DEPARTMENT })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DEPARTMENT)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly department?: string;

  @ApiPropertyOptional({ maxLength: MAX_LOCATION })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LOCATION)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly location?: string;

  @ApiPropertyOptional({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] })
  @IsOptional()
  @IsEnum({ FULL_TIME: 'FULL_TIME', PART_TIME: 'PART_TIME', CONTRACT: 'CONTRACT' })
  readonly type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

  @ApiPropertyOptional({ enum: ['REMOTE', 'HYBRID', 'ONSITE'] })
  @IsOptional()
  @IsEnum({ REMOTE: 'REMOTE', HYBRID: 'HYBRID', ONSITE: 'ONSITE' })
  readonly workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE';

  @ApiPropertyOptional({ maxLength: MAX_DESCRIPTION })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION)
  readonly description?: string;

  @ApiPropertyOptional({ maxLength: MAX_REQUIREMENTS })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_REQUIREMENTS)
  readonly requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly salaryMax?: number;

  @ApiPropertyOptional({ maxLength: CURRENCY_LENGTH })
  @IsOptional()
  @IsString()
  @Length(CURRENCY_LENGTH, CURRENCY_LENGTH)
  readonly salaryCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  readonly closesAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly cvRequired?: boolean;

  @ApiPropertyOptional({ type: [CustomFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  readonly customFields?: CustomFieldDto[];
}
