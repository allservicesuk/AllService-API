/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO for submitting a TOTP code during login challenge or sensitive-operation re-authentication.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

const MFA_CODE_LENGTH = 6;
const MFA_CODE_PATTERN = /^[0-9]{6}$/;

export class VerifyMfaDto {
  @ApiProperty({ minLength: MFA_CODE_LENGTH, maxLength: MFA_CODE_LENGTH })
  @IsString()
  @Length(MFA_CODE_LENGTH, MFA_CODE_LENGTH)
  @Matches(MFA_CODE_PATTERN, { message: 'code must be numeric' })
  readonly code!: string;
}
