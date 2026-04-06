/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Reads or mints the per-request UUID identifier and echoes it back on the response.
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestHeaders, ResponseHeaders } from '@common/constants';
import { generateId } from '@common/utils/id.util';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerValue = req.header(RequestHeaders.REQUEST_ID);
    const requestId = headerValue && UUID_REGEX.test(headerValue) ? headerValue : generateId();
    req.requestId = requestId;
    res.setHeader(ResponseHeaders.REQUEST_ID, requestId);
    next();
  }
}
