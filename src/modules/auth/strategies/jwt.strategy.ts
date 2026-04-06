/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Passport JWT strategy that extracts tokens from Bearer header or HttpOnly cookie and validates the user.
 */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy, type StrategyOptionsWithoutRequest } from 'passport-jwt';

import { ErrorCode } from '@common/constants';
import type { AuthenticatedUser } from '@common/interfaces/request-with-user.interface';
import jwtConfig from '@config/jwt.config';

import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SessionService } from '../session.service';
import { UserService } from '../../user/user.service';

const SESSION_COOKIE_NAME = '__Host-session';
const JWT_ALGORITHM = 'RS256';

const fromSessionCookie = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  if (!cookies) {
    return null;
  }
  const raw = cookies[SESSION_COOKIE_NAME];
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY) jwt: ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        fromSessionCookie,
      ]),
      secretOrKey: jwt.publicKey,
      algorithms: [JWT_ALGORITHM],
      issuer: jwt.issuer,
      audience: jwt.audience,
      ignoreExpiration: false,
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userService.findByIdWithSecrets(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Token subject not found',
      });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_DISABLED,
        message: 'Account disabled',
      });
    }
    if (user.isLocked && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_LOCKED,
        message: 'Account locked',
      });
    }
    if (user.passwordChangedAt && user.passwordChangedAt.getTime() / 1_000 > payload.iat) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_REVOKED,
        message: 'Token invalidated by password change',
      });
    }
    const sessionExists = await this.sessionService.getCurrentRefreshTokenHash(
      payload.sub,
      payload.jti,
    );
    if (!sessionExists) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_REVOKED,
        message: 'Session has been revoked',
      });
    }
    return {
      id: user.id,
      email: user.email,
      roles: payload.roles,
      permissions: payload.permissions,
      tenantId: payload.tenantId,
      sessionId: payload.jti,
    };
  }
}
