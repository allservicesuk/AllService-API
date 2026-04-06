/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin lock action DTO carrying a reason string and optional lock duration in minutes.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const REASON_MIN = 1;
const REASON_MAX = 255;
const DURATION_MIN_MINUTES = 1;
const DURATION_MAX_MINUTES = 525_600;

export class LockUserDto {
  @ApiProperty({ minLength: REASON_MIN, maxLength: REASON_MAX })
  @IsString()
  @MinLength(REASON_MIN)
  @MaxLength(REASON_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly reason!: string;

  @ApiPropertyOptional({ minimum: DURATION_MIN_MINUTES, maximum: DURATION_MAX_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(DURATION_MIN_MINUTES)
  @Max(DURATION_MAX_MINUTES)
  readonly durationMinutes?: number;
}
