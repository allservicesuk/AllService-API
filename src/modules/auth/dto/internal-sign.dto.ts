/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * DTO for the internal token signing endpoint consumed by replica regions.
 */
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class InternalSignDto {
  @IsString()
  @IsNotEmpty()
  readonly sub!: string;

  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @IsArray()
  @IsString({ each: true })
  readonly roles!: string[];

  @IsArray()
  @IsString({ each: true })
  readonly permissions!: string[];

  @IsOptional()
  @IsString()
  readonly tenantId!: string | null;

  @IsString()
  @IsNotEmpty()
  readonly jti!: string;
}
