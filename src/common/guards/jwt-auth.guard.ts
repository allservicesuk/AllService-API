/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global JWT authentication guard that skips @Public() routes and maps Passport errors to error codes.
 */
import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

import { ErrorCode } from '@common/constants';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

interface PassportInfo {
  readonly name?: string;
  readonly message?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    info: PassportInfo | undefined,
  ): TUser {
    if (err || !user) {
      throw this.buildUnauthorizedException(info);
    }
    return user as TUser;
  }

  private buildUnauthorizedException(info: PassportInfo | undefined): UnauthorizedException {
    const name = info?.name;
    if (name === 'TokenExpiredError') {
      return new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Access token expired',
      });
    }
    if (name === 'JsonWebTokenError') {
      return new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Access token invalid',
      });
    }
    return new UnauthorizedException({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
    });
  }
}
