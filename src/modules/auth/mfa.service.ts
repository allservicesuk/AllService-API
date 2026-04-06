/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * TOTP-based MFA with otplib for code verification, qrcode for setup, and encrypted secret storage.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

import { ErrorCode, RedisKeys } from '@common/constants';
import regionConfig from '@config/region.config';

import { RedisService } from '../../redis/redis.service';
import { CryptoService } from '../../crypto/crypto.service';
import type { UserWithSecrets } from '../user/interfaces/user-with-secrets.interface';
import { UserService, type AuditContext } from '../user/user.service';

const MFA_ISSUER = 'AllServices';
const MFA_SETUP_TTL_SECONDS = 10 * 60;
const MFA_WINDOW_STEPS = 1;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 6;
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MFA_SECRET_AAD = 'mfa:secret';

export interface MfaSetupResult {
  readonly secret: string;
  readonly qrCodeUrl: string;
  readonly recoveryCodes: readonly string[];
}

interface MfaSetupRedisPayload {
  readonly secret: string;
  readonly recoveryCodes: readonly string[];
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
    private readonly userService: UserService,
  ) {
    authenticator.options = { window: MFA_WINDOW_STEPS };
  }

  async generateSetup(userId: string, userEmail: string): Promise<MfaSetupResult> {
    const secret = authenticator.generateSecret();
    const recoveryCodes = this.generateRecoveryCodes();
    const payload: MfaSetupRedisPayload = { secret, recoveryCodes };
    await this.redis.setJson(
      RedisKeys.mfaSetup(this.region.region, userId),
      payload,
      MFA_SETUP_TTL_SECONDS,
    );
    const otpauthUri = authenticator.keyuri(userEmail, MFA_ISSUER, secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUri);
    return { secret, qrCodeUrl, recoveryCodes };
  }

  async verifySetup(userId: string, code: string, context: AuditContext): Promise<boolean> {
    const key = RedisKeys.mfaSetup(this.region.region, userId);
    const payload = await this.redis.getJson<MfaSetupRedisPayload>(key);
    if (!payload) {
      throw new BadRequestException({
        code: ErrorCode.MFA_SETUP_REQUIRED,
        message: 'MFA setup expired or not started',
      });
    }
    const isValid = authenticator.verify({ token: code, secret: payload.secret });
    if (!isValid) {
      return false;
    }
    const encryptedSecret = this.crypto.encryptAtRest(payload.secret, MFA_SECRET_AAD);
    const hashedRecoveryCodes = payload.recoveryCodes.map((rc) => this.hashRecoveryCode(rc));
    await this.userService.setMfaSecret(userId, encryptedSecret, hashedRecoveryCodes, context);
    await this.redis.del(key);
    this.logger.log(`mfa.verifySetup.success userId=${userId} region=${this.region.region}`);
    return true;
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userService.findByIdWithSecrets(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }
    const secret = this.safeDecryptSecret(user.mfaSecret);
    if (secret !== null && authenticator.verify({ token: code, secret })) {
      return true;
    }
    return this.consumeRecoveryCodeIfMatches(user, code);
  }

  async disable(userId: string, context: AuditContext): Promise<void> {
    await this.userService.clearMfa(userId, context);
    this.logger.log(`mfa.disabled userId=${userId} region=${this.region.region}`);
  }

  private generateRecoveryCodes(): readonly string[] {
    const codes: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
      codes.push(this.generateRecoveryCode());
    }
    return codes;
  }

  private generateRecoveryCode(): string {
    const bytes = randomBytes(RECOVERY_CODE_BYTES * 2);
    const chars: string[] = [];
    for (let i = 0; i < RECOVERY_CODE_BYTES * 2; i += 1) {
      const byte = bytes[i] ?? 0;
      chars.push(RECOVERY_CODE_ALPHABET.charAt(byte % RECOVERY_CODE_ALPHABET.length));
    }
    const raw = chars.join('');
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  }

  private hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code, 'utf8').digest('hex');
  }

  private safeDecryptSecret(ciphertext: string): string | null {
    try {
      return this.crypto.decryptAtRest(ciphertext, MFA_SECRET_AAD);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`mfa.secret.decrypt.failed reason=${reason}`);
      return null;
    }
  }

  private async consumeRecoveryCodeIfMatches(
    user: UserWithSecrets,
    code: string,
  ): Promise<boolean> {
    const candidateHash = this.hashRecoveryCode(code);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    for (const stored of user.mfaRecoveryCodes) {
      const storedBuffer = Buffer.from(stored, 'hex');
      if (storedBuffer.length !== candidateBuffer.length) {
        continue;
      }
      if (timingSafeEqual(storedBuffer, candidateBuffer)) {
        await this.userService.consumeRecoveryCode(user.id, stored);
        this.logger.log(`mfa.recovery.consumed userId=${user.id}`);
        return true;
      }
    }
    return false;
  }
}
