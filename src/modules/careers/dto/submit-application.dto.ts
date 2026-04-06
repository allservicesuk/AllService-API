/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for submitting a job application (multipart body fields, file handled by multer).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

const MAX_NAME = 200;
const MAX_PHONE = 30;
const MAX_COVER_LETTER = 10000;
const CODE_LENGTH = 6;

export class SubmitApplicationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly jobPostingId!: string;

  @ApiProperty({ maxLength: MAX_NAME })
  @IsString()
  @MaxLength(MAX_NAME)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly name!: string;

  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email!: string;

  @ApiPropertyOptional({ maxLength: MAX_PHONE })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PHONE)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly phone?: string;

  @ApiPropertyOptional({ maxLength: MAX_COVER_LETTER })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_COVER_LETTER)
  readonly coverLetter?: string;

  @ApiProperty({ description: '6-digit email verification code' })
  @IsString()
  @Length(CODE_LENGTH, CODE_LENGTH)
  readonly verificationCode!: string;

  @ApiPropertyOptional({ description: 'Answers to custom fields defined on the posting' })
  @IsOptional()
  @IsObject()
  readonly customResponses?: Record<string, string | number | boolean>;
}
