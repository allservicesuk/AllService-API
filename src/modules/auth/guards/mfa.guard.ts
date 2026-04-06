/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Route guard that enforces MFA-enabled accounts on routes marked with @RequireMfa().
 */
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ErrorCode } from '@common/constants';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

import { UserService } from '../../user/user.service';

export const REQUIRE_MFA_KEY = 'requireMfa';

export const RequireMfa = (): ReturnType<typeof SetMetadata> => SetMetadata(REQUIRE_MFA_KEY, true);

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new ForbiddenException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }
    const fresh = await this.userService.findByIdOrFail(request.user.id);
    if (!fresh.mfaEnabled) {
      throw new ForbiddenException({
        code: ErrorCode.MFA_SETUP_REQUIRED,
        message: 'MFA must be enabled for this action',
      });
    }
    return true;
  }
}
