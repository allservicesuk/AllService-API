/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Route guard allowing a caller to access a record only when the target id matches or they are admin.
 */
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ErrorCode, Role } from '@common/constants';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new ForbiddenException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }
    const params = request.params as Record<string, string | undefined>;
    const targetId = params['id'];
    if (typeof targetId === 'string' && targetId === request.user.id) {
      return true;
    }
    if (request.user.roles.includes(Role.ADMIN)) {
      return true;
    }
    throw new ForbiddenException({
      code: ErrorCode.FORBIDDEN_USER_ACCESS,
      message: 'Access to this user record is forbidden',
    });
  }
}
