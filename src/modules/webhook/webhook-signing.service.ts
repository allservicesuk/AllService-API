/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * HMAC-SHA256 signing and verification for webhook payloads with replay protection.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import webhookConfig from '@config/webhook.config';

import { SIGNING_SECRET_BYTES } from './webhook.constants';

const REPLAY_TOLERANCE_SECONDS = 300;

export interface SignedHeaders {
  readonly signature: string;
  readonly timestamp: string;
}

@Injectable()
export class WebhookSigningService {
  constructor(
    @Inject(webhookConfig.KEY) private readonly config: ConfigType<typeof webhookConfig>,
  ) {}

  generateSecret(): string {
    return randomBytes(SIGNING_SECRET_BYTES).toString('hex');
  }

  sign(payload: string, secret: string): SignedHeaders {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureInput = `${timestamp}.${payload}`;
    const signature = createHmac(this.config.signingAlgorithm, secret)
      .update(signatureInput)
      .digest('hex');
    return {
      signature: `v1=${signature}`,
      timestamp,
    };
  }

  verify(payload: string, secret: string, signature: string, timestamp: string): boolean {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > REPLAY_TOLERANCE_SECONDS) {
      return false;
    }
    const signatureInput = `${timestamp}.${payload}`;
    const expected = createHmac(this.config.signingAlgorithm, secret)
      .update(signatureInput)
      .digest('hex');
    const expectedPrefixed = `v1=${expected}`;
    const signatureClean = signature.startsWith('v1=') ? signature : `v1=${signature}`;
    if (expectedPrefixed.length !== signatureClean.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expectedPrefixed), Buffer.from(signatureClean));
  }
}
