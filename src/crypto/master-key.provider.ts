/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Loads CRYPTO_MASTER_KEY at boot, derives HKDF sub-keys per version, and fails fast on bad input.
 */
import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { deriveKey } from '@common/utils/crypto.util';
import cryptoConfig, { type CryptoKeyVersion } from '@config/crypto.config';

const MASTER_KEY_HEX_LENGTH = 64;
const REST_KEY_SALT = Buffer.from('allservices-rest-v1', 'utf8');
const REST_KEY_INFO = 'at-rest-encryption';
const TOKEN_KEY_SALT = Buffer.from('allservices-tokens-v1', 'utf8');
const TOKEN_KEY_INFO = 'token-hmac';
const FINGERPRINT_LENGTH = 8;

export interface RestKeySet {
  readonly keys: ReadonlyMap<CryptoKeyVersion, Buffer>;
  readonly activeVersion: CryptoKeyVersion;
}

@Injectable()
export class MasterKeyProvider {
  private readonly logger = new Logger(MasterKeyProvider.name);
  private readonly restKeys: Map<CryptoKeyVersion, Buffer>;
  private readonly tokenKeyBuffer: Buffer;
  private readonly activeVersion: CryptoKeyVersion;

  constructor(@Inject(cryptoConfig.KEY) private readonly config: ConfigType<typeof cryptoConfig>) {
    const masters = this.loadMasters();
    this.restKeys = new Map();
    for (const [version, master] of masters.entries()) {
      this.restKeys.set(version, deriveKey(master, REST_KEY_SALT, REST_KEY_INFO));
      this.logger.log(
        `crypto.master_key.loaded version=${version} fingerprint=${this.fingerprint(master)}`,
      );
    }
    const activeMaster = masters.get(this.config.activeVersion);
    if (!activeMaster) {
      throw new Error(`Missing master key for active version ${this.config.activeVersion}`);
    }
    this.tokenKeyBuffer = deriveKey(activeMaster, TOKEN_KEY_SALT, TOKEN_KEY_INFO);
    this.activeVersion = this.config.activeVersion;
  }

  getRestKeySet(): RestKeySet {
    return { keys: this.restKeys, activeVersion: this.activeVersion };
  }

  getTokenKey(): Buffer {
    return this.tokenKeyBuffer;
  }

  private loadMasters(): Map<CryptoKeyVersion, Buffer> {
    const masters = new Map<CryptoKeyVersion, Buffer>();
    this.validateAndStore(masters, 'v1', this.config.masterKeyV1);
    if (this.config.masterKeyV2 !== null) {
      this.validateAndStore(masters, 'v2', this.config.masterKeyV2);
    }
    if (masters.size === 0) {
      throw new Error('CRYPTO_MASTER_KEY not set');
    }
    return masters;
  }

  private validateAndStore(
    target: Map<CryptoKeyVersion, Buffer>,
    version: CryptoKeyVersion,
    hex: string,
  ): void {
    if (hex.length !== MASTER_KEY_HEX_LENGTH) {
      throw new Error(`CRYPTO_MASTER_KEY ${version} must be 32 bytes (64 hex chars)`);
    }
    if (!/^[0-9a-f]+$/i.test(hex)) {
      throw new Error(`CRYPTO_MASTER_KEY ${version} must be hex-encoded`);
    }
    target.set(version, Buffer.from(hex, 'hex'));
  }

  private fingerprint(master: Buffer): string {
    return createHash('sha256').update(master).digest('hex').slice(0, FINGERPRINT_LENGTH);
  }
}
