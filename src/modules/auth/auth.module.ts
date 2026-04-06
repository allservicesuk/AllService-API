/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Auth module wiring Passport, JWT signing, session, MFA, and user-event-driven session revocation.
 */
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import jwtConfig from '@config/jwt.config';

import { CryptoModule } from '../../crypto/crypto.module';
import { MailModule } from '../../mail/mail.module';
import { UserModule } from '../user/user.module';

import { InternalApiGuard } from '@common/guards/internal-api.guard';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaGuard } from './guards/mfa.guard';
import { InternalTokenController } from './internal-token.controller';
import { UserEventsListener } from './listeners/user-events.listener';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

const JWT_ALGORITHM = 'RS256';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        ...(config.privateKey ? { privateKey: config.privateKey } : {}),
        publicKey: config.publicKey,
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: config.accessTtlSeconds,
          issuer: config.issuer,
          audience: config.audience,
        },
        verifyOptions: {
          algorithms: [JWT_ALGORITHM],
          issuer: config.issuer,
          audience: config.audience,
        },
      }),
    }),
    CryptoModule,
    MailModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController, InternalTokenController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    MfaService,
    SessionService,
    JwtStrategy,
    UserEventsListener,
    MfaGuard,
    InternalApiGuard,
  ],
  exports: [AuthService, TokenService, PasswordService, MfaService, SessionService],
})
export class AuthModule {}
