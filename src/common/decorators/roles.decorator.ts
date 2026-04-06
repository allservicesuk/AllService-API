/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Legacy role-name gating decorator; prefer @RequirePermission for new routes.
 */
import { SetMetadata } from '@nestjs/common';

import type { RoleCode } from '@common/constants';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleCode[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
