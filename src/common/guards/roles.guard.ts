/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Role-name gating guard that runs after PermissionsGuard and backs admin-tooling endpoints.
 */
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ErrorCode, type RoleCode } from '@common/constants';
import { ROLES_KEY } from '@common/decorators/roles.decorator';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new ForbiddenException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }
    const actorRoles = new Set(request.user.roles);
    const passes = requiredRoles.some((role) => actorRoles.has(role));
    if (!passes) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Role check failed',
      });
    }
    return true;
  }
}
