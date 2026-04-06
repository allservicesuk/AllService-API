/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Throttler guard variant that keys rate limits by real client IP from Cloudflare, not Express req.ip.
 */
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    const realIp = req['realIp'];
    if (typeof realIp === 'string' && realIp.length > 0) {
      return Promise.resolve(realIp);
    }
    const fallback = req['ip'];
    return Promise.resolve(typeof fallback === 'string' ? fallback : 'unknown');
  }
}
