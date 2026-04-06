/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Outward-facing user shape that never carries passwordHash, mfaSecret, or any credential secret.
 */
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly email!: string;

  @ApiProperty({ nullable: true, type: String })
  readonly firstName!: string | null;

  @ApiProperty({ nullable: true, type: String })
  readonly lastName!: string | null;

  @ApiProperty({ type: [String] })
  readonly roles!: readonly string[];

  @ApiProperty()
  readonly isActive!: boolean;

  @ApiProperty()
  readonly isLocked!: boolean;

  @ApiProperty({ nullable: true, type: String })
  readonly lockReason!: string | null;

  @ApiProperty({ nullable: true, type: String })
  readonly lockedUntil!: string | null;

  @ApiProperty()
  readonly emailVerified!: boolean;

  @ApiProperty()
  readonly mfaEnabled!: boolean;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  readonly tenantId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  readonly lastLoginAt!: string | null;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;
}
