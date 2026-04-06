/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validation DTO for sending a message in an application conversation.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

const MAX_BODY = 10000;

export class SendMessageDto {
  @ApiProperty({ maxLength: MAX_BODY })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_BODY)
  readonly body!: string;
}
