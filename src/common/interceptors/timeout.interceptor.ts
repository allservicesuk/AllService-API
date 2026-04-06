/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Enforces a per-request timeout and converts RxJS TimeoutError into the standard REQUEST_TIMEOUT error.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { throwError, TimeoutError, type Observable } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { ErrorCode } from '@common/constants';

export const TIMEOUT_KEY = 'routeTimeoutMs';
export const DEFAULT_TIMEOUT_MS = 30_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const override = this.reflector.getAllAndOverride<number | undefined>(TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const timeoutMs = override ?? DEFAULT_TIMEOUT_MS;
    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                code: ErrorCode.REQUEST_TIMEOUT,
                message: 'Request timed out',
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
