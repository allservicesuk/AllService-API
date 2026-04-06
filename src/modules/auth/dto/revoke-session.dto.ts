/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO used to revoke another session belonging to the authenticated user.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RevokeSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly sessionId!: string;
}
