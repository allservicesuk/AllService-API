/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Response DTO for application data returned from the API.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicationDocumentResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly filename!: string;

  @ApiProperty()
  readonly mimeType!: string;

  @ApiProperty()
  readonly sizeBytes!: number;

  @ApiProperty()
  readonly createdAt!: string;
}

export class ApplicationResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'uuid' })
  readonly jobPostingId!: string;

  @ApiProperty()
  readonly applicantName!: string;

  @ApiProperty()
  readonly applicantEmail!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly applicantPhone!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly coverLetter!: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  readonly customResponses!: Record<string, unknown> | null;

  @ApiProperty()
  readonly status!: string;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly jobTitle?: string | null | undefined;

  @ApiPropertyOptional({ type: [ApplicationDocumentResponseDto] })
  readonly documents?: ApplicationDocumentResponseDto[] | undefined;
}
