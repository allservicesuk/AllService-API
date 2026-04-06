/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global permissions guard that enforces @RequirePermission metadata with AND/ANY modes and self-scope checks.
 */
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ErrorCode } from '@common/constants';
import {
  PERMISSIONS_KEY,
  SELF_PARAM_KEY,
  type PermissionMetadata,
} from '@common/decorators/permissions.decorator';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

const SELF_SCOPE_SUFFIX = ':self';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata || metadata.permissions.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new ForbiddenException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }
    const actorPermissions = new Set(request.user.permissions);
    const selfParam = this.reflector.getAllAndOverride<string | undefined>(SELF_PARAM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const satisfies = (perm: string): boolean => {
      if (!actorPermissions.has(perm)) {
        return false;
      }
      if (perm.endsWith(SELF_SCOPE_SUFFIX)) {
        return this.isSelfRequest(request, selfParam ?? 'id');
      }
      return true;
    };
    const passes =
      metadata.mode === 'all'
        ? metadata.permissions.every(satisfies)
        : metadata.permissions.some(satisfies);
    if (!passes) {
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Insufficient permissions',
      });
    }
    return true;
  }

  private isSelfRequest(request: RequestWithUser, paramName: string): boolean {
    const params = request.params as Record<string, string | undefined>;
    const body = request.body as Record<string, unknown> | undefined;
    if (request.path.endsWith('/me')) {
      return true;
    }
    const paramValue = params[paramName];
    if (typeof paramValue === 'string' && paramValue === request.user.id) {
      return true;
    }
    const bodyUserId = body?.['userId'];
    return typeof bodyUserId === 'string' && bodyUserId === request.user.id;
  }
}
