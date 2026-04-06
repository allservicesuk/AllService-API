/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Attaches the RegionContext to every request and emits X-Region/X-Read-Only response headers.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { Response } from 'express';

import { ResponseHeaders } from '@common/constants';
import type { RequestWithRegion } from '@common/interfaces/request-with-region.interface';

import { RegionService } from '../../region/region.service';

@Injectable()
export class RegionInterceptor implements NestInterceptor {
  constructor(private readonly region: RegionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithRegion>();
    const response = http.getResponse<Response>();
    const readOnly = !this.region.isWriteCapable() || !this.region.isWriteAvailable();
    request.region = {
      region: this.region.getRegion() as RequestWithRegion['region']['region'],
      role: this.region.getRole() as RequestWithRegion['region']['role'],
      isWriteCapable: this.region.isWriteCapable(),
      isReadOnly: readOnly,
    };
    response.setHeader(ResponseHeaders.REGION, this.region.getRegion());
    if (readOnly) {
      response.setHeader(ResponseHeaders.READ_ONLY, 'true');
    }
    return next.handle();
  }
}
