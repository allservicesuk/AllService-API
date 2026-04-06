/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Parameter decorator that extracts the current region code from the request context.
 */
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestWithRegion } from '@common/interfaces/request-with-region.interface';

export const CurrentRegion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithRegion>();
    return request.region.region;
  },
);
