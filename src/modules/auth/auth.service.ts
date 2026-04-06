/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Orchestrates register, login, refresh, logout, email verification, password reset, MFA, and session flows.
 */
import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { ErrorCode, RedisKeys, flattenRoles } from '@common/constants';
import regionConfig from '@config/region.config';

import { AuditService, type AuditEntry } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import { MetricsService } from '../../observability/metrics.service';
import { PostHogService } from '../../observability/posthog.service';
import { RedisService } from '../../redis/redis.service';
import type { UserSafe } from '../user/interfaces/user-safe.interface';
import type { UserWithSecrets } from '../user/interfaces/user-with-secrets.interface';
import { UserService, type AuditContext } from '../user/user.service';

import type { AuthResponseDto, AuthResponseUser, LoginResponseDto } from './dto/auth-response.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { DisableMfaDto } from './dto/disable-mfa.dto';
import type { EnableMfaDto } from './dto/enable-mfa.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { VerifyEmailDto } from './dto/verify-email.dto';
import type { MfaSetupResult } from './mfa.service';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import type { SessionInfo } from './session.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const FAILED_LOGIN_LOCK_THRESHOLD = 5;
const FAILED_LOGIN_LOCK_MINUTES = 15;
const MS_PER_MINUTE = 60_000;
const VERIFY_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const RESET_TOKEN_TTL_SECONDS = 60 * 60;
const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
const TOKEN_BYTES = 48;
const TIMING_DELAY_MIN_MS = 150;
const TIMING_DELAY_JITTER_MS = 100;
const MFA_CHALLENGE_CACHE_MODULE = 'mfa';

export interface LoginContext {
  readonly ipHash: string;
  readonly userAgent: string | null;
  readonly requestId: string;
  readonly deviceInfo: string | null;
}

export type RegisterContext = LoginContext;

export interface ChangePasswordContext extends AuditContext {
  readonly sessionId: string;
}

interface MfaChallengePayload {
  readonly userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly mfaService: MfaService,
    private readonly mailService: MailService,
    private readonly redis: RedisService,
    private readonly posthog: PostHogService,
    private readonly metrics: MetricsService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto, context: RegisterContext): Promise<AuthResponseDto> {
    const strength = this.passwordService.validateStrength(dto.password);
    if (!strength.valid) {
      throw new BadRequestException({
        code: ErrorCode.PASSWORD_TOO_WEAK,
        message: 'Password does not meet strength requirements',
        detail: { reason: strength.reason ?? 'unknown' },
      });
    }
    const breached = await this.passwordService.checkBreached(dto.password);
    if (breached) {
      throw new BadRequestException({
        code: ErrorCode.PASSWORD_BREACHED,
        message: 'Password has appeared in a known data breach',
      });
    }
    const exists = await this.userService.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'Email already exists',
      });
    }
    const passwordHash = await this.passwordService.hash(dto.password);
    const created = await this.userService.create({
      email: dto.email,
      passwordHash,
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      emailVerified: false,
    });
    await this.queueVerificationEmail(created);
    const tokens = await this.issueTokens(created, context);
    await this.writeAuthAudit('auth.register', created.id, context, { email: created.email });
    this.metrics.authRegisterTotal.inc({ region: this.region.region });
    this.posthog.capture(created.id, 'user_registered', { email: created.email });
    return this.buildAuthResponse(created, tokens);
  }

  async login(dto: LoginDto, context: LoginContext): Promise<LoginResponseDto> {
    const user = await this.userService.findByEmailWithSecrets(dto.email);
    if (!user) {
      await this.simulateHashTiming();
      this.metrics.authLoginTotal.inc({ status: 'failed', region: this.region.region });
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    this.assertAccountUsable(user);
    const passwordValid = await this.passwordService.verify(dto.password, user.passwordHash ?? '');
    if (!passwordValid) {
      await this.handleLoginFailure(user, context);
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return this.issueMfaChallenge(user);
      }
      const mfaValid = await this.mfaService.verifyCode(user.id, dto.mfaCode);
      if (!mfaValid) {
        this.metrics.authLoginTotal.inc({ status: 'mfa_invalid', region: this.region.region });
        throw new UnauthorizedException({
          code: ErrorCode.MFA_INVALID,
          message: 'Invalid MFA code',
        });
      }
    }
    await this.userService.recordLoginSuccess(user.id, context.ipHash);
    const tokens = await this.issueTokens(user, context);
    await this.writeAuthAudit('auth.login', user.id, context, { sessionId: tokens.sessionId });
    this.metrics.authLoginTotal.inc({ status: 'success', region: this.region.region });
    this.posthog.capture(user.id, 'user_logged_in', {});
    return this.buildAuthResponse(user, tokens);
  }

  async refresh(
    rawRefreshToken: string,
    context: LoginContext,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const refreshContext = {
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      requestId: context.requestId,
    };
    const result = await this.sessionService.refresh(rawRefreshToken, refreshContext);
    const user = await this.userService.findByIdOrFail(result.userId);
    const permissions = flattenRoles(user.roles);
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions,
      tenantId: user.tenantId,
      jti: result.sessionId,
    });
    return {
      accessToken,
      refreshToken: result.refreshToken,
      expiresIn: this.tokenService.getAccessTtlSeconds(),
    };
  }

  async logout(userId: string, sessionId: string, context: AuditContext): Promise<void> {
    await this.sessionService.revoke(sessionId, userId, context);
    await this.writeAuthAudit('auth.logout', userId, context, { sessionId });
  }

  async logoutAll(userId: string, context: AuditContext): Promise<void> {
    await this.sessionService.revokeAll(userId, context, 'user_logout_all');
    await this.writeAuthAudit('auth.logout.all', userId, context, null);
  }

  async verifyEmail(dto: VerifyEmailDto, context: AuditContext): Promise<void> {
    const key = RedisKeys.emailVerify(this.region.region, dto.token);
    const userId = await this.redis.get(key);
    if (!userId) {
      throw new BadRequestException({
        code: ErrorCode.VERIFICATION_TOKEN_INVALID,
        message: 'Verification token invalid or expired',
      });
    }
    await this.userService.markEmailVerified(userId, context);
    await this.redis.del(key);
    await this.writeAuthAudit('auth.email.verify', userId, context, null);
    this.posthog.capture(userId, 'email_verified', {});
  }

  async forgotPassword(dto: ForgotPasswordDto, context: AuditContext): Promise<void> {
    await this.writeAuthAudit('auth.password.reset.request', null, context, { email: dto.email });
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      return;
    }
    const token = this.generateOpaqueToken();
    await this.redis.set(
      RedisKeys.passwordReset(this.region.region, token),
      user.id,
      RESET_TOKEN_TTL_SECONDS,
    );
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1_000).toISOString();
    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      ...(user.firstName ? { name: user.firstName } : {}),
      token,
      expiresAt,
    });
  }

  async resetPassword(dto: ResetPasswordDto, context: AuditContext): Promise<void> {
    const key = RedisKeys.passwordReset(this.region.region, dto.token);
    const userId = await this.redis.get(key);
    if (!userId) {
      throw new BadRequestException({
        code: ErrorCode.RESET_TOKEN_INVALID,
        message: 'Reset token invalid or expired',
      });
    }
    await this.assertPasswordAcceptable(dto.newPassword);
    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.userService.updatePassword(userId, passwordHash, context);
    await this.sessionService.revokeAll(userId, context, 'password_reset');
    await this.redis.del(key);
    await this.writeAuthAudit('auth.password.reset', userId, context, null);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    context: ChangePasswordContext,
  ): Promise<void> {
    const user = await this.userService.findByIdWithSecrets(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    const ok = await this.passwordService.verify(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    await this.assertPasswordAcceptable(dto.newPassword);
    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.userService.updatePassword(userId, passwordHash, context);
    await this.sessionService.revokeAllExcept(userId, context.sessionId, context);
    await this.mailService.sendPasswordChangedEmail({
      to: user.email,
      ...(user.firstName ? { name: user.firstName } : {}),
      changedAt: new Date().toISOString(),
      ipHash: context.ipHash,
    });
    await this.writeAuthAudit('auth.password.change', userId, context, null);
    this.posthog.capture(userId, 'password_changed', {});
  }

  async mfaSetup(userId: string, userEmail: string): Promise<MfaSetupResult> {
    return this.mfaService.generateSetup(userId, userEmail);
  }

  async mfaVerifySetup(userId: string, dto: EnableMfaDto, context: AuditContext): Promise<boolean> {
    const valid = await this.mfaService.verifySetup(userId, dto.code, context);
    if (valid) {
      const user = await this.userService.findByIdOrFail(userId);
      await this.mailService.sendMfaEnabledEmail({
        to: user.email,
        ...(user.firstName ? { name: user.firstName } : {}),
      });
      await this.writeAuthAudit('auth.mfa.enable', userId, context, null);
      this.posthog.capture(userId, 'mfa_enabled', {});
    }
    return valid;
  }

  async mfaDisable(userId: string, dto: DisableMfaDto, context: AuditContext): Promise<void> {
    const user = await this.userService.findByIdWithSecrets(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    const passwordOk = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
    }
    const mfaOk = await this.mfaService.verifyCode(userId, dto.code);
    if (!mfaOk) {
      throw new UnauthorizedException({
        code: ErrorCode.MFA_INVALID,
        message: 'Invalid MFA code',
      });
    }
    await this.mfaService.disable(userId, context);
    await this.writeAuthAudit('auth.mfa.disable', userId, context, null);
    this.posthog.capture(userId, 'mfa_disabled', {});
  }

  async listSessions(userId: string, currentSessionId: string): Promise<readonly SessionInfo[]> {
    return this.sessionService.listSessions(userId, currentSessionId);
  }

  async revokeSession(
    userId: string,
    targetSessionId: string,
    context: AuditContext,
  ): Promise<void> {
    await this.sessionService.revoke(targetSessionId, userId, context);
  }

  async consumeMfaChallenge(challengeToken: string): Promise<string | null> {
    const key = RedisKeys.cache(
      this.region.region,
      MFA_CHALLENGE_CACHE_MODULE,
      `challenge:${challengeToken}`,
    );
    const raw = await this.redis.getJson<MfaChallengePayload>(key);
    if (!raw) {
      return null;
    }
    await this.redis.del(key);
    return raw.userId;
  }

  private async issueTokens(
    user: UserSafe | UserWithSecrets,
    context: LoginContext,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; sessionId: string }> {
    const session = await this.sessionService.create(user.id, context.deviceInfo, context.ipHash);
    const permissions = flattenRoles(user.roles);
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions,
      tenantId: user.tenantId,
      jti: session.sessionId,
    });
    return {
      accessToken,
      refreshToken: session.refreshToken,
      expiresIn: this.tokenService.getAccessTtlSeconds(),
      sessionId: session.sessionId,
    };
  }

  private buildAuthResponse(
    user: UserSafe | UserWithSecrets,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  ): AuthResponseDto {
    const responseUser: AuthResponseUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
    };
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: responseUser,
    };
  }

  private assertAccountUsable(user: UserWithSecrets): void {
    if (user.isLocked && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_LOCKED,
        message: 'Account locked',
        detail: { lockedUntil: user.lockedUntil.toISOString() },
      });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_DISABLED,
        message: 'Account disabled',
      });
    }
  }

  private async handleLoginFailure(user: UserWithSecrets, context: LoginContext): Promise<void> {
    const attempts = await this.userService.incrementFailedLoginAttempts(user.id);
    if (attempts >= FAILED_LOGIN_LOCK_THRESHOLD) {
      const until = new Date(Date.now() + FAILED_LOGIN_LOCK_MINUTES * MS_PER_MINUTE);
      await this.userService.lock(user.id, 'too_many_failed_attempts', until, null, {
        ipHash: context.ipHash,
        userAgent: context.userAgent,
        requestId: context.requestId,
      });
      await this.mailService.sendAccountLockedEmail({
        to: user.email,
        ...(user.firstName ? { name: user.firstName } : {}),
        reason: 'too_many_failed_attempts',
        lockedUntil: until.toISOString(),
      });
    }
    this.metrics.authLoginTotal.inc({ status: 'failed', region: this.region.region });
    this.posthog.capture(user.id, 'login_failed', { reason: 'invalid_password' });
  }

  private async issueMfaChallenge(
    user: UserWithSecrets,
  ): Promise<{ mfaRequired: true; mfaSessionToken: string; expiresIn: number }> {
    const challengeToken = this.generateOpaqueToken();
    const payload: MfaChallengePayload = { userId: user.id };
    await this.redis.setJson(
      RedisKeys.cache(
        this.region.region,
        MFA_CHALLENGE_CACHE_MODULE,
        `challenge:${challengeToken}`,
      ),
      payload,
      MFA_CHALLENGE_TTL_SECONDS,
    );
    this.metrics.authLoginTotal.inc({ status: 'mfa_required', region: this.region.region });
    return {
      mfaRequired: true,
      mfaSessionToken: challengeToken,
      expiresIn: MFA_CHALLENGE_TTL_SECONDS,
    };
  }

  private async queueVerificationEmail(user: UserSafe): Promise<void> {
    const token = this.generateOpaqueToken();
    await this.redis.set(
      RedisKeys.emailVerify(this.region.region, token),
      user.id,
      VERIFY_TOKEN_TTL_SECONDS,
    );
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_SECONDS * 1_000).toISOString();
    await this.mailService.sendVerificationEmail({
      to: user.email,
      ...(user.firstName ? { name: user.firstName } : {}),
      token,
      expiresAt,
    });
  }

  private async writeAuthAudit(
    action: string,
    userId: string | null,
    context: AuditContext,
    detail: Record<string, unknown> | null,
  ): Promise<void> {
    const entry: AuditEntry = {
      action,
      userId,
      resource: userId ? `user:${userId}` : null,
      detail,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      region: this.region.region,
      requestId: context.requestId,
    };
    await this.audit.log(entry);
    this.logger.log(`${action} userId=${userId ?? 'anonymous'} region=${this.region.region}`);
  }

  private async assertPasswordAcceptable(password: string): Promise<void> {
    const strength = this.passwordService.validateStrength(password);
    if (!strength.valid) {
      throw new BadRequestException({
        code: ErrorCode.PASSWORD_TOO_WEAK,
        message: 'Password does not meet strength requirements',
        detail: { reason: strength.reason ?? 'unknown' },
      });
    }
    const breached = await this.passwordService.checkBreached(password);
    if (breached) {
      throw new BadRequestException({
        code: ErrorCode.PASSWORD_BREACHED,
        message: 'Password has appeared in a known data breach',
      });
    }
  }

  private generateOpaqueToken(): string {
    return randomBytes(TOKEN_BYTES).toString('hex');
  }

  private async simulateHashTiming(): Promise<void> {
    const jitter = Math.floor(Math.random() * TIMING_DELAY_JITTER_MS);
    const delay = TIMING_DELAY_MIN_MS + jitter;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}
