/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Guard that validates the x-internal-secret header for inter-region API calls.
 */
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

import { ErrorCode } from '@common/constants';
import regionConfig from '@config/region.config';

const INTERNAL_SECRET_HEADER = 'x-internal-secret';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(@Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const incoming = request.headers[INTERNAL_SECRET_HEADER];
    if (typeof incoming !== 'string' || incoming.length === 0) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing internal API secret',
      });
    }
    const expected = this.region.internalApiSecret;
    if (expected.length === 0) {
      throw new UnauthorizedException({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'INTERNAL_API_SECRET not configured',
      });
    }
    const incomingBuf = Buffer.from(incoming, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (incomingBuf.length !== expectedBuf.length || !timingSafeEqual(incomingBuf, expectedBuf)) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid internal API secret',
      });
    }
    return true;
  }
}
