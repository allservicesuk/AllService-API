/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Propagates incoming X-Correlation-Id or reuses the request id when absent for cross-region calls.
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestHeaders } from '@common/constants';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const incoming = req.header(RequestHeaders.CORRELATION_ID);
    req.correlationId = incoming && incoming.length > 0 ? incoming : req.requestId;
    next();
  }
}
