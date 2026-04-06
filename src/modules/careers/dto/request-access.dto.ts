/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for requesting a new magic-link access token via email.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsUUID } from 'class-validator';

export class RequestAccessDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly jobPostingId!: string;
}
