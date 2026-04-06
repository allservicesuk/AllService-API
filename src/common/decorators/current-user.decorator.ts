/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Parameter decorator that extracts the authenticated user payload from the current request.
 */
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type {
  AuthenticatedUser,
  RequestWithUser,
} from '@common/interfaces/request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
