/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global exception filter that converts every thrown error into the standard response envelope.
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ErrorCode, type ErrorCodeValue } from '@common/constants';
import { SentryService } from '../../observability/sentry.service';

interface ErrorDetail {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

interface ErrorEnvelope {
  readonly error: {
    readonly code: ErrorCodeValue;
    readonly message: string;
    readonly statusCode: number;
    readonly requestId: string;
    readonly timestamp: string;
    readonly region: string;
    readonly details?: readonly ErrorDetail[];
    readonly retryAfter?: number;
  };
}

interface StructuredExceptionBody {
  readonly code?: ErrorCodeValue;
  readonly message?: string | readonly string[];
  readonly details?: readonly ErrorDetail[];
  readonly retryAfter?: number;
}

const STATUS_CODE_MAP: Record<number, ErrorCodeValue> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.REQUEST_TIMEOUT]: ErrorCode.REQUEST_TIMEOUT,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.GONE]: ErrorCode.GONE,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_FAILED,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

const GENERIC_500_MESSAGE = 'An unexpected error occurred.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly sentry: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = request.requestId ?? 'unknown';
    const region = request.header('x-region') ?? process.env['REGION'] ?? 'unknown';

    if (exception instanceof HttpException) {
      const envelope = this.buildHttpEnvelope(exception, requestId, region);
      response.status(envelope.error.statusCode).json(envelope);
      return;
    }

    this.logger.error(
      {
        requestId,
        path: request.path,
        method: request.method,
        err:
          exception instanceof Error
            ? { message: exception.message, stack: exception.stack }
            : exception,
      },
      'Unhandled exception',
    );
    this.sentry.captureException(exception, { requestId, region });

    const envelope: ErrorEnvelope = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: GENERIC_500_MESSAGE,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId,
        timestamp: new Date().toISOString(),
        region,
      },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(envelope);
  }

  private buildHttpEnvelope(
    exception: HttpException,
    requestId: string,
    region: string,
  ): ErrorEnvelope {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    const structured = this.extractStructuredBody(body);
    const code = structured.code ?? STATUS_CODE_MAP[statusCode] ?? ErrorCode.INTERNAL_ERROR;
    const message = this.resolveMessage(structured, exception);
    const details = this.resolveDetails(structured, body);

    return {
      error: {
        code,
        message,
        statusCode,
        requestId,
        timestamp: new Date().toISOString(),
        region,
        ...(details && details.length > 0 ? { details } : {}),
        ...(structured.retryAfter !== undefined ? { retryAfter: structured.retryAfter } : {}),
      },
    };
  }

  private extractStructuredBody(body: unknown): StructuredExceptionBody {
    if (body === null || typeof body !== 'object') {
      return {};
    }
    return body as StructuredExceptionBody;
  }

  private resolveMessage(structured: StructuredExceptionBody, exception: HttpException): string {
    if (typeof structured.message === 'string') {
      return structured.message;
    }
    if (Array.isArray(structured.message)) {
      const first: unknown = structured.message[0];
      if (typeof first === 'string') {
        return first;
      }
    }
    return exception.message;
  }

  private resolveDetails(
    structured: StructuredExceptionBody,
    body: unknown,
  ): readonly ErrorDetail[] | undefined {
    if (structured.details && structured.details.length > 0) {
      return structured.details;
    }
    if (body !== null && typeof body === 'object' && 'message' in body) {
      const rawMessage = (body as { message: unknown }).message;
      if (Array.isArray(rawMessage)) {
        return rawMessage.map(
          (msg): ErrorDetail => ({
            field: 'unknown',
            message: typeof msg === 'string' ? msg : JSON.stringify(msg),
            code: ErrorCode.VALIDATION_FAILED,
          }),
        );
      }
    }
    return undefined;
  }
}
