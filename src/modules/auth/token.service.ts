/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Issues RS256 access tokens locally on the primary region and delegates signing to EU on replicas.
 */
import { randomBytes } from 'node:crypto';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ErrorCode } from '@common/constants';
import jwtConfig from '@config/jwt.config';
import regionConfig from '@config/region.config';

import type { JwtPayload, JwtSignInput } from './interfaces/jwt-payload.interface';

const REFRESH_TOKEN_BYTES = 64;
const JWT_ALGORITHM = 'RS256';
const INTERNAL_SIGN_PATH = '/internal/tokens/sign';
const INTERNAL_SIGN_TIMEOUT_MS = 5_000;
const INTERNAL_SIGN_HEADER = 'x-internal-secret';

interface InternalSignResponse {
  readonly accessToken: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @Inject(jwtConfig.KEY) private readonly jwt: ConfigType<typeof jwtConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async generateAccessToken(input: JwtSignInput): Promise<string> {
    if (this.region.isPrimary) {
      return this.signLocally(input);
    }
    return this.signRemotely(input);
  }

  generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        publicKey: this.jwt.publicKey,
        algorithms: [JWT_ALGORITHM],
        issuer: this.jwt.issuer,
        audience: this.jwt.audience,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`token.verify.failed reason=${reason}`);
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid or expired token',
      });
    }
  }

  decodeWithoutVerification(token: string): JwtPayload | null {
    const decoded: unknown = this.jwtService.decode(token);
    if (decoded === null || typeof decoded !== 'object') {
      return null;
    }
    return decoded as JwtPayload;
  }

  getAccessTtlSeconds(): number {
    return this.jwt.accessTtlSeconds;
  }

  private async signLocally(input: JwtSignInput): Promise<string> {
    if (!this.jwt.privateKey) {
      throw new InternalServerErrorException({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'JWT_PRIVATE_KEY not configured on primary region',
      });
    }
    const payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: input.sub,
      email: input.email,
      roles: input.roles,
      permissions: input.permissions,
      tenantId: input.tenantId,
      jti: input.jti,
    };
    return this.jwtService.signAsync(payload, {
      privateKey: this.jwt.privateKey,
      algorithm: JWT_ALGORITHM,
      expiresIn: this.jwt.accessTtlSeconds,
      issuer: this.jwt.issuer,
      audience: this.jwt.audience,
    });
  }

  private async signRemotely(input: JwtSignInput): Promise<string> {
    if (!this.region.primaryApiUrl) {
      throw new InternalServerErrorException({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'PRIMARY_API_URL not configured on replica region',
      });
    }
    if (!this.region.internalApiSecret) {
      throw new InternalServerErrorException({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'INTERNAL_API_SECRET not configured on replica region',
      });
    }
    const url = `${this.region.primaryApiUrl}${INTERNAL_SIGN_PATH}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INTERNAL_SIGN_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [INTERNAL_SIGN_HEADER]: this.region.internalApiSecret,
        },
        body: JSON.stringify({
          sub: input.sub,
          email: input.email,
          roles: input.roles,
          permissions: input.permissions,
          tenantId: input.tenantId,
          jti: input.jti,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.error(
          `token.remote.sign.failed status=${response.status} region=${this.region.region}`,
        );
        throw new InternalServerErrorException({
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Unable to sign access token via primary region',
        });
      }
      const body = (await response.json()) as InternalSignResponse;
      if (typeof body.accessToken !== 'string' || body.accessToken.length === 0) {
        throw new InternalServerErrorException({
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Primary region returned invalid signing response',
        });
      }
      return body.accessToken;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`token.remote.sign.error reason=${reason}`);
      throw new InternalServerErrorException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Primary region unreachable for signing',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
