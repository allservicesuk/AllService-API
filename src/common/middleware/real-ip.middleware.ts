/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Extracts the real client IP from Cloudflare headers and attaches hashed + raw copies to the request.
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { sha256 } from '@common/utils/hash.util';

const CF_CONNECTING_IP = 'cf-connecting-ip';
const X_FORWARDED_FOR = 'x-forwarded-for';
const IP_HASH_LENGTH = 16;

@Injectable()
export class RealIpMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const ip = this.resolveIp(req);
    req.realIp = ip;
    req.ipHash = sha256(ip).slice(0, IP_HASH_LENGTH);
    next();
  }

  private resolveIp(req: Request): string {
    const cfIp = req.header(CF_CONNECTING_IP);
    if (cfIp && cfIp.length > 0) {
      return cfIp.trim();
    }
    const forwarded = req.header(X_FORWARDED_FOR);
    if (forwarded && forwarded.length > 0) {
      const first = forwarded.split(',')[0]?.trim();
      if (first && first.length > 0) {
        return first;
      }
    }
    return req.ip ?? 'unknown';
  }
}
