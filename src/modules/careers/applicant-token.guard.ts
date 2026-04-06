/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Guard that validates magic-link bearer tokens for applicant-facing endpoints.
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { ErrorCode } from '@common/constants/error-codes';

import { ApplicantTokenService } from './applicant-token.service';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class ApplicantTokenGuard implements CanActivate {
  constructor(private readonly tokenService: ApplicantTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException({
        code: ErrorCode.APPLICANT_TOKEN_INVALID,
        message: 'Missing or invalid applicant token',
      });
    }

    const rawToken = authHeader.slice(BEARER_PREFIX.length);

    if (rawToken.length === 0) {
      throw new UnauthorizedException({
        code: ErrorCode.APPLICANT_TOKEN_INVALID,
        message: 'Empty applicant token',
      });
    }

    const applicationId = await this.tokenService.validateMagicLinkToken(rawToken);

    if (!applicationId) {
      throw new UnauthorizedException({
        code: ErrorCode.APPLICANT_TOKEN_EXPIRED,
        message: 'Applicant token is invalid or expired',
      });
    }

    (request as Request & { applicationId: string }).applicationId = applicationId;
    return true;
  }
}
