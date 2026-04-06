/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Request logging interceptor that records duration, status, and user context, feeding Prometheus.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

import { MetricsService } from '../../observability/metrics.service';

const MS_PER_SECOND = 1000;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & Partial<RequestWithUser>>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();
    return next.handle().pipe(
      tap({
        next: () => this.emit(request, response, startedAt, null),
        error: (error: unknown) => this.emit(request, response, startedAt, error),
      }),
    );
  }

  private emit(
    request: Request & Partial<RequestWithUser>,
    response: Response,
    startedAt: bigint,
    error: unknown,
  ): void {
    const durationNs = process.hrtime.bigint() - startedAt;
    const durationSeconds = Number(durationNs) / 1e9;
    const durationMs = durationSeconds * MS_PER_SECOND;
    const statusCode = response.statusCode;
    const method = request.method;
    const route = request.route as { path?: string } | undefined;
    const path = route?.path ?? request.path;
    const region = process.env['REGION'] ?? 'unknown';
    const labels = {
      method,
      path,
      status_code: String(statusCode),
      region,
    };
    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labels, durationSeconds);
    const logPayload = {
      requestId: request.requestId,
      userId: request.user?.id,
      method,
      path,
      statusCode,
      durationMs: Math.round(durationMs),
      region,
    };
    if (error) {
      this.logger.error(JSON.stringify({ ...logPayload, err: this.serialiseError(error) }));
    } else {
      this.logger.log(JSON.stringify(logPayload));
    }
  }

  private serialiseError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return { message: error.message, ...(error.stack ? { stack: error.stack } : {}) };
    }
    return { message: String(error) };
  }
}
