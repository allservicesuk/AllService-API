/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for creating a new job posting.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import type { CustomFieldType } from '../interfaces/custom-field.interface';

const ALLOWED_FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'select',
  'url',
  'number',
  'boolean',
];
const MAX_LABEL = 255;
const MAX_PLACEHOLDER = 500;
const MAX_OPTION_LENGTH = 255;
const MAX_TITLE = 255;
const MAX_DEPARTMENT = 100;
const MAX_LOCATION = 200;
const MAX_DESCRIPTION = 50000;
const MAX_REQUIREMENTS = 50000;
const CURRENCY_LENGTH = 3;

export class CustomFieldDto {
  @ApiProperty()
  @IsString()
  @MaxLength(MAX_LABEL)
  readonly id!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_LABEL)
  readonly label!: string;

  @ApiProperty({ enum: ALLOWED_FIELD_TYPES })
  @IsIn(ALLOWED_FIELD_TYPES)
  readonly type!: CustomFieldType;

  @ApiProperty()
  @IsBoolean()
  readonly required!: boolean;

  @ApiPropertyOptional({ maxLength: MAX_PLACEHOLDER })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PLACEHOLDER)
  readonly placeholder?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(MAX_OPTION_LENGTH, { each: true })
  readonly options?: string[];
}

export class CreatePostingDto {
  @ApiProperty({ maxLength: MAX_TITLE })
  @IsString()
  @MaxLength(MAX_TITLE)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly title!: string;

  @ApiProperty({ maxLength: MAX_DEPARTMENT })
  @IsString()
  @MaxLength(MAX_DEPARTMENT)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly department!: string;

  @ApiProperty({ maxLength: MAX_LOCATION })
  @IsString()
  @MaxLength(MAX_LOCATION)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly location!: string;

  @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] })
  @IsEnum({ FULL_TIME: 'FULL_TIME', PART_TIME: 'PART_TIME', CONTRACT: 'CONTRACT' })
  readonly type!: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

  @ApiProperty({ enum: ['REMOTE', 'HYBRID', 'ONSITE'] })
  @IsEnum({ REMOTE: 'REMOTE', HYBRID: 'HYBRID', ONSITE: 'ONSITE' })
  readonly workMode!: 'REMOTE' | 'HYBRID' | 'ONSITE';

  @ApiProperty({ maxLength: MAX_DESCRIPTION })
  @IsString()
  @MaxLength(MAX_DESCRIPTION)
  readonly description!: string;

  @ApiProperty({ maxLength: MAX_REQUIREMENTS })
  @IsString()
  @MaxLength(MAX_REQUIREMENTS)
  readonly requirements!: string;

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

  @ApiPropertyOptional({ enum: ['HOURLY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsOptional()
  @IsEnum({ HOURLY: 'HOURLY', WEEKLY: 'WEEKLY', BIWEEKLY: 'BIWEEKLY', MONTHLY: 'MONTHLY', YEARLY: 'YEARLY' })
  readonly salaryPeriod?: 'HOURLY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  readonly closesAt?: string;

  @ApiPropertyOptional({ default: true })
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
