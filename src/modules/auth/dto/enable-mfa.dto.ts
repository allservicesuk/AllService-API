/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO used on the second step of MFA setup to confirm the authenticator by submitting a TOTP code.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

const MFA_CODE_LENGTH = 6;
const MFA_CODE_PATTERN = /^[0-9]{6}$/;

export class EnableMfaDto {
  @ApiProperty({ minLength: MFA_CODE_LENGTH, maxLength: MFA_CODE_LENGTH })
  @IsString()
  @Length(MFA_CODE_LENGTH, MFA_CODE_LENGTH)
  @Matches(MFA_CODE_PATTERN, { message: 'code must be numeric' })
  readonly code!: string;
}
