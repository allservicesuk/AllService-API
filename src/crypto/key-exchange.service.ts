/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * X25519 ECDH handshake that produces Redis-held per-session AES keys for desktop clients.
 */
import {
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { ErrorCode } from '@common/constants';
import { deriveKey } from '@common/utils/crypto.util';
import cryptoConfig from '@config/crypto.config';

import { KeyStoreService } from './key-store.service';

const X25519_PUBLIC_KEY_BYTES = 32;
const SESSION_ID_BYTES = 16;
const SESSION_INFO = 'allservices-session-v1';
const MS_PER_SECOND = 1000;

export interface HandshakeResult {
  readonly serverPublicKey: Buffer;
  readonly sessionId: string;
  readonly expiresAt: Date;
}

export class HandshakeFailedError extends Error {
  readonly code = ErrorCode.HANDSHAKE_FAILED;
  constructor(reason: string) {
    super(`handshake_failed: ${reason}`);
    this.name = 'HandshakeFailedError';
  }
}

@Injectable()
export class KeyExchangeService {
  constructor(
    @Inject(cryptoConfig.KEY) private readonly config: ConfigType<typeof cryptoConfig>,
    private readonly keyStore: KeyStoreService,
  ) {}

  async initiateHandshake(clientPublicKey: Buffer): Promise<HandshakeResult> {
    if (clientPublicKey.length !== X25519_PUBLIC_KEY_BYTES) {
      throw new HandshakeFailedError('invalid_client_public_key_length');
    }
    const serverKeyPair = generateKeyPairSync('x25519');
    const serverPublicKey = serverKeyPair.publicKey.export({ type: 'spki', format: 'der' });
    const rawServerPublic = this.extractRawX25519Public(serverPublicKey);
    const sharedSecret = diffieHellman({
      privateKey: serverKeyPair.privateKey,
      publicKey: this.buildClientPublicKeyObject(clientPublicKey),
    });
    const salt = Buffer.concat([clientPublicKey, rawServerPublic]);
    const sessionKey = deriveKey(sharedSecret, salt, SESSION_INFO);
    const sessionId = randomBytes(SESSION_ID_BYTES).toString('hex');
    await this.keyStore.store(sessionId, sessionKey, this.config.sessionTtlSeconds);
    sharedSecret.fill(0);
    sessionKey.fill(0);
    const expiresAt = new Date(Date.now() + this.config.sessionTtlSeconds * MS_PER_SECOND);
    return { serverPublicKey: rawServerPublic, sessionId, expiresAt };
  }

  async validateSessionKey(sessionId: string): Promise<Buffer> {
    const key = await this.keyStore.retrieve(sessionId);
    if (!key) {
      throw new UnauthorizedException({
        code: ErrorCode.ENCRYPTED_SESSION_REQUIRED,
        message: 'Encrypted session required',
      });
    }
    return key;
  }

  private extractRawX25519Public(derSpki: Buffer): Buffer {
    return derSpki.subarray(derSpki.length - X25519_PUBLIC_KEY_BYTES);
  }

  private buildClientPublicKeyObject(rawPublic: Buffer): KeyObject {
    const spkiPrefix = Buffer.from('302a300506032b656e032100', 'hex');
    const spki = Buffer.concat([spkiPrefix, rawPublic]);
    return createPublicKey({ key: spki, format: 'der', type: 'spki' });
  }
}
