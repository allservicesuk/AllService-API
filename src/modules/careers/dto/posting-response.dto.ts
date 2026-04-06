/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Response DTO for job posting data returned from the API.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostingResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly title!: string;

  @ApiProperty()
  readonly slug!: string;

  @ApiProperty()
  readonly department!: string;

  @ApiProperty()
  readonly location!: string;

  @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] })
  readonly type!: string;

  @ApiProperty({ enum: ['REMOTE', 'HYBRID', 'ONSITE'] })
  readonly workMode!: string;

  @ApiProperty()
  readonly description!: string;

  @ApiProperty()
  readonly requirements!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  readonly salaryMin!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  readonly salaryMax!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly salaryCurrency!: string | null;

  @ApiProperty()
  readonly cvRequired!: boolean;

  @ApiPropertyOptional({ type: Object, nullable: true })
  readonly customFields!: unknown[] | null;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'] })
  readonly status!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly closesAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly publishedAt!: string | null;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;
}
