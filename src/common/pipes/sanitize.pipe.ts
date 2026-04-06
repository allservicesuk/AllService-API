/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Strips all HTML tags from string inputs in DTO bodies to prevent stored XSS via user content.
 */
import { Injectable, type PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

@Injectable()
export class SanitizePipe implements PipeTransform<unknown, unknown> {
  transform(value: unknown): unknown {
    return this.sanitise(value);
  }

  private sanitise(value: unknown): unknown {
    if (typeof value === 'string') {
      return sanitizeHtml(value, SANITIZE_OPTIONS);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitise(item));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = this.sanitise(val);
      }
      return result;
    }
    return value;
  }
}
