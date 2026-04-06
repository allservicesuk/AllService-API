/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Low-level AES-256-GCM and HKDF-SHA256 primitives used by the crypto module and at-rest encryption.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

export interface AesEncryptResult {
  readonly nonce: Buffer;
  readonly ciphertext: Buffer;
  readonly tag: Buffer;
}

const AES_ALG = 'aes-256-gcm';
const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const TAG_BYTES = 16;

export function aesEncrypt(plaintext: Buffer, key: Buffer, aad?: Buffer): AesEncryptResult {
  if (key.length !== KEY_BYTES) {
    throw new Error(`aesEncrypt: key must be ${KEY_BYTES} bytes`);
  }
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(AES_ALG, key, nonce, { authTagLength: TAG_BYTES });
  if (aad) {
    cipher.setAAD(aad);
  }
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { nonce, ciphertext, tag };
}

export function aesDecrypt(
  nonce: Buffer,
  ciphertext: Buffer,
  tag: Buffer,
  key: Buffer,
  aad?: Buffer,
): Buffer {
  if (key.length !== KEY_BYTES) {
    throw new Error(`aesDecrypt: key must be ${KEY_BYTES} bytes`);
  }
  if (nonce.length !== NONCE_BYTES) {
    throw new Error(`aesDecrypt: nonce must be ${NONCE_BYTES} bytes`);
  }
  if (tag.length !== TAG_BYTES) {
    throw new Error(`aesDecrypt: tag must be ${TAG_BYTES} bytes`);
  }
  const decipher = createDecipheriv(AES_ALG, key, nonce, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(tag);
  if (aad) {
    decipher.setAAD(aad);
  }
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function deriveKey(sharedSecret: Buffer, salt: Buffer, info: string): Buffer {
  const derived = hkdfSync('sha256', sharedSecret, salt, Buffer.from(info, 'utf8'), KEY_BYTES);
  return Buffer.from(derived);
}
