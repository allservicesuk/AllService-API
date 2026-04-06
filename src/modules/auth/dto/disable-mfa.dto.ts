/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO to disable MFA by re-authenticating with password and a current TOTP code.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';

const MFA_CODE_LENGTH = 6;
const MFA_CODE_PATTERN = /^[0-9]{6}$/;

export class DisableMfaDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  readonly password!: string;

  @ApiProperty({ minLength: MFA_CODE_LENGTH, maxLength: MFA_CODE_LENGTH })
  @IsString()
  @Length(MFA_CODE_LENGTH, MFA_CODE_LENGTH)
  @Matches(MFA_CODE_PATTERN, { message: 'code must be numeric' })
  readonly code!: string;
}
