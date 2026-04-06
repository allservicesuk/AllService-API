/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Self-service profile update DTO requiring at least one of firstName, lastName.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { AtLeastOneField } from '@common/validators/at-least-one-field.validator';

const NAME_MIN = 1;
const NAME_MAX = 100;

export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: NAME_MIN, maxLength: NAME_MAX })
  @IsOptional()
  @IsString()
  @MinLength(NAME_MIN)
  @MaxLength(NAME_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly firstName?: string;

  @ApiPropertyOptional({ minLength: NAME_MIN, maxLength: NAME_MAX })
  @IsOptional()
  @IsString()
  @MinLength(NAME_MIN)
  @MaxLength(NAME_MAX)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  readonly lastName?: string;

  @AtLeastOneField(['firstName', 'lastName'])
  readonly _atLeastOne?: never;
}
