/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Interceptor that writes an audit entry after a successful handler run when @Audited is present.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { RequestWithRegion } from '@common/interfaces/request-with-region.interface';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

import { AuditService } from './audit.service';
import { AUDITED_KEY } from './audited.decorator';

const USER_AGENT_HEADER = 'user-agent';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string | undefined>(AUDITED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) {
      return next.handle();
    }
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRegion & Partial<RequestWithUser>>();
    return next.handle().pipe(
      tap({
        next: () => {
          void this.dispatch(action, request);
        },
      }),
    );
  }

  private async dispatch(
    action: string,
    request: RequestWithRegion & Partial<RequestWithUser>,
  ): Promise<void> {
    try {
      const userAgentHeader = request.header(USER_AGENT_HEADER);
      const route = request.route as { path?: string } | undefined;
      const resource = route?.path ?? request.path;
      await this.auditService.log({
        action,
        userId: request.user?.id ?? null,
        resource,
        detail: null,
        ipHash: request.ipHash,
        userAgent: userAgentHeader ?? null,
        region: request.region.region,
        requestId: request.requestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'audit_dispatch_failed';
      this.logger.error(
        `audit.interceptor.failed action=${action} requestId=${request.requestId} reason=${message}`,
      );
    }
  }
}
