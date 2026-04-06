/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * At-rest field encryption with version-tagged wire format and AAD-bound AES-256-GCM.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { aesDecrypt, aesEncrypt } from '@common/utils/crypto.util';
import type { CryptoKeyVersion } from '@config/crypto.config';

import { CRYPTO_REST_KEY } from './crypto.tokens';
import type { RestKeySet } from './master-key.provider';

const WIRE_PART_COUNT = 4;

export class DecryptionFailedError extends Error {
  readonly code = 'DECRYPTION_FAILED';
  constructor(reason: string) {
    super(`decryption_failed: ${reason}`);
    this.name = 'DecryptionFailedError';
  }
}

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(@Inject(CRYPTO_REST_KEY) private readonly restKeys: RestKeySet) {}

  encryptAtRest(plaintext: string, aad?: string): string {
    const activeKey = this.restKeys.keys.get(this.restKeys.activeVersion);
    if (!activeKey) {
      throw new Error('Active rest key not loaded');
    }
    const result = aesEncrypt(
      Buffer.from(plaintext, 'utf8'),
      activeKey,
      aad ? Buffer.from(aad, 'utf8') : undefined,
    );
    return [
      this.restKeys.activeVersion,
      result.nonce.toString('hex'),
      result.ciphertext.toString('hex'),
      result.tag.toString('hex'),
    ].join(':');
  }

  decryptAtRest(ciphertext: string, aad?: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== WIRE_PART_COUNT) {
      throw new DecryptionFailedError('malformed_wire_format');
    }
    const [versionTag, nonceHex, ctHex, tagHex] = parts as [string, string, string, string];
    const version = versionTag as CryptoKeyVersion;
    const key = this.restKeys.keys.get(version);
    if (!key) {
      this.logger.warn(`decrypt_failed unknown_version=${versionTag} length=${ciphertext.length}`);
      throw new DecryptionFailedError('unknown_version');
    }
    try {
      const plaintext = aesDecrypt(
        Buffer.from(nonceHex, 'hex'),
        Buffer.from(ctHex, 'hex'),
        Buffer.from(tagHex, 'hex'),
        key,
        aad ? Buffer.from(aad, 'utf8') : undefined,
      );
      return plaintext.toString('utf8');
    } catch {
      this.logger.warn(
        `decrypt_failed tag_mismatch version=${versionTag} length=${ciphertext.length}`,
      );
      throw new DecryptionFailedError('tag_mismatch');
    }
  }

  rotateField(oldCiphertext: string, aad?: string): string {
    const plaintext = this.decryptAtRest(oldCiphertext, aad);
    return this.encryptAtRest(plaintext, aad);
  }
}
