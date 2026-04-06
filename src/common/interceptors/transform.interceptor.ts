/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Wraps handler responses in the standard data+meta envelope and merges pagination metadata.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IS_RAW_RESPONSE_KEY } from '@common/decorators/raw-response.decorator';
import type { ApiMeta, PaginationMeta } from '@common/dto/api-response.dto';
import type { RequestWithRegion } from '@common/interfaces/request-with-region.interface';
import appConfig from '@config/app.config';

interface PaginatedPayload<T> {
  readonly data: readonly T[];
  readonly meta?: { readonly pagination?: PaginationMeta };
}

interface WrappedResponse<T> {
  readonly data: T;
  readonly meta: ApiMeta;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(IS_RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isRaw) {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<RequestWithRegion>();
    return next.handle().pipe(
      map((payload: unknown): unknown => {
        if (this.isAlreadyWrapped(payload)) {
          return payload;
        }
        return this.wrap(payload, request);
      }),
    );
  }

  private isAlreadyWrapped(payload: unknown): boolean {
    return (
      payload !== null &&
      typeof payload === 'object' &&
      'data' in payload &&
      'meta' in payload &&
      typeof (payload as { meta: unknown }).meta === 'object'
    );
  }

  private wrap(payload: unknown, request: RequestWithRegion): WrappedResponse<unknown> {
    const pagination = this.extractPagination(payload);
    const region = request.region?.region ?? process.env['REGION'] ?? 'unknown';
    const meta: ApiMeta = {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      version: this.config.apiVersion,
      region,
      ...(pagination ? { pagination } : {}),
    };
    const data = pagination ? (payload as PaginatedPayload<unknown>).data : payload;
    return { data, meta };
  }

  private extractPagination(payload: unknown): PaginationMeta | null {
    if (payload === null || typeof payload !== 'object' || !('data' in payload)) {
      return null;
    }
    const typed = payload as PaginatedPayload<unknown>;
    if (!Array.isArray(typed.data)) {
      return null;
    }
    const pagination = typed.meta?.pagination;
    return pagination ?? null;
  }
}
