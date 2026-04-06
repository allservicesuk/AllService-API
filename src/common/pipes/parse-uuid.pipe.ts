/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Validates UUID v4 or v7 path parameters and rejects malformed input at the controller boundary.
 */
import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

import { ErrorCode } from '@common/constants';

const UUID_V4_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !UUID_V4_V7_REGEX.test(value)) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Invalid UUID format',
      });
    }
    return value;
  }
}
