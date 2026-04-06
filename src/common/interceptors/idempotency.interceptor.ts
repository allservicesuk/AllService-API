/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Replays cached responses for POST/PUT requests carrying X-Idempotency-Key within 24 hours.
 */
import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, of, type Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { RedisKeys } from '@common/constants';
import { IDEMPOTENT_KEY } from '@common/decorators/idempotent.decorator';
import type { RequestWithRegion } from '@common/interfaces/request-with-region.interface';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

import { RedisService } from '../../redis/redis.service';

const IDEMPOTENCY_TTL_SECONDS = 86_400;
const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const IDEMPOTENT_METHODS = new Set(['POST', 'PUT']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRegion & Partial<RequestWithUser>>();
    if (!IDEMPOTENT_METHODS.has(request.method)) {
      return next.handle();
    }
    const idempotencyKey = request.header(IDEMPOTENCY_HEADER);
    const requiresKey = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!idempotencyKey || idempotencyKey.length === 0) {
      if (requiresKey === true) {
        throw new BadRequestException({
          code: 'VALIDATION_FAILED',
          message: 'X-Idempotency-Key header required',
        });
      }
      return next.handle();
    }
    if (!request.user) {
      return next.handle();
    }
    const cacheKey = RedisKeys.idempotency(request.region.region, request.user.id, idempotencyKey);
    return from(this.redis.getJson<unknown>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== null) {
          return of(cached);
        }
        return next.handle().pipe(
          tap((payload: unknown) => {
            void this.redis.setJson(cacheKey, payload, IDEMPOTENCY_TTL_SECONDS);
          }),
        );
      }),
    );
  }
}
