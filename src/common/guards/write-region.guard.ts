/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Rejects @WriteOperation-decorated requests when the current region cannot service writes.
 */
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ErrorCode } from '@common/constants';
import { WRITE_OPERATION_KEY } from '@common/decorators/write-operation.decorator';

import { RegionService } from '../../region/region.service';

const RETRY_AFTER_SECONDS = 30;

@Injectable()
export class WriteRegionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly region: RegionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isWrite = this.reflector.getAllAndOverride<boolean>(WRITE_OPERATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isWrite) {
      return true;
    }
    if (!this.region.isWriteCapable()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_READ_ONLY,
        message: 'Region is read-only',
        retryAfter: RETRY_AFTER_SECONDS,
      });
    }
    if (!this.region.isWriteAvailable()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.WRITE_REGION_UNAVAILABLE,
        message: 'Write database unavailable',
        retryAfter: RETRY_AFTER_SECONDS,
      });
    }
    return true;
  }
}
