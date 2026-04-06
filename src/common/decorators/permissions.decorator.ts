/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Permission-based authorisation decorators with AND/ANY modes and self-scope routing helpers.
 */
import {
  createParamDecorator,
  SetMetadata,
  type CustomDecorator,
  type ExecutionContext,
} from '@nestjs/common';

import type { PermissionCode } from '@common/constants';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const PERMISSIONS_MODE_KEY = 'requiredPermissionsMode';
export const SELF_PARAM_KEY = 'selfParam';

export type PermissionMode = 'all' | 'any';

export interface PermissionMetadata {
  readonly permissions: readonly PermissionCode[];
  readonly mode: PermissionMode;
}

export function RequirePermission(...permissions: PermissionCode[]): CustomDecorator<string> {
  return SetMetadata<string, PermissionMetadata>(PERMISSIONS_KEY, {
    permissions,
    mode: 'all',
  });
}

export function RequireAnyPermission(...permissions: PermissionCode[]): CustomDecorator<string> {
  return SetMetadata<string, PermissionMetadata>(PERMISSIONS_KEY, {
    permissions,
    mode: 'any',
  });
}

export const SelfParam = (paramName = 'id'): ReturnType<typeof SetMetadata> =>
  SetMetadata(SELF_PARAM_KEY, paramName);

export const CurrentPermissions = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): readonly string[] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.permissions ?? [];
  },
);
