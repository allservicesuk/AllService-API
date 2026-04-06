/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * REST controller for /v1/auth exposing registration, login, MFA, sessions, and password flows.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { ErrorCode } from '@common/constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { ReadOnlySafe } from '@common/decorators/read-only-safe.decorator';
import { WriteOperation } from '@common/decorators/write-operation.decorator';
import type {
  AuthenticatedUser,
  RequestWithUser,
} from '@common/interfaces/request-with-user.interface';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe';

import { UserMapper } from '../user/user.mapper';
import { UserService } from '../user/user.service';
import type { UserResponseDto } from '../user/dto/user-response.dto';

import { AuthService } from './auth.service';
import type { AuthResponseDto, LoginResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
import { EnableMfaDto } from './dto/enable-mfa.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import type { MfaSetupResult } from './mfa.service';
import type { SessionInfo } from './session.service';

const CLIENT_PLATFORM_HEADER = 'x-client-platform';
const USER_AGENT_HEADER = 'user-agent';
const WEB_CLIENT_VALUE = 'web';
const SESSION_COOKIE_NAME = '__Host-session';
const MS_PER_SECOND = 1_000;
const REGISTER_RATE = 3;
const LOGIN_RATE = 5;
const REFRESH_RATE = 10;
const VERIFY_EMAIL_RATE = 5;
const PASSWORD_RESET_RATE = 3;
const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3_600;

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Post('register')
  @Public()
  @WriteOperation()
  @RateLimit(REGISTER_RATE, MINUTE_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const context = this.buildLoginContext(req);
    const result = await this.authService.register(dto, context);
    return this.applyTokenDelivery(req, res, result);
  }

  @Post('login')
  @Public()
  @WriteOperation()
  @RateLimit(LOGIN_RATE, MINUTE_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Authenticate and issue session tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login success or MFA challenge' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const context = this.buildLoginContext(req);
    const result = await this.authService.login(dto, context);
    if ('mfaRequired' in result) {
      return result;
    }
    return this.applyTokenDelivery(req, res, result);
  }

  @Post('refresh')
  @Public()
  @WriteOperation()
  @RateLimit(REFRESH_RATE, MINUTE_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed' })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string | null; expiresIn: number }> {
    const rawRefreshToken = this.extractRefreshToken(req, dto);
    if (!rawRefreshToken) {
      throw new BadRequestException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token missing',
      });
    }
    const context = this.buildLoginContext(req);
    const result = await this.authService.refresh(rawRefreshToken, context);
    if (this.isWebClient(req)) {
      this.setSessionCookie(res, result.refreshToken, result.expiresIn);
      return { accessToken: result.accessToken, refreshToken: null, expiresIn: result.expiresIn };
    }
    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  @WriteOperation()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Session revoked' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.id, user.sessionId, this.buildAuditContext(req));
    if (this.isWebClient(req)) {
      this.clearSessionCookie(res);
    }
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @WriteOperation()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every active session for the current user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'All sessions revoked' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user.id, this.buildAuditContext(req));
    if (this.isWebClient(req)) {
      this.clearSessionCookie(res);
    }
  }

  @Post('verify-email')
  @Public()
  @WriteOperation()
  @RateLimit(VERIFY_EMAIL_RATE, MINUTE_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Verify email address via emailed token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: true }> {
    await this.authService.verifyEmail(dto, this.buildAuditContext(req));
    return { success: true };
  }

  @Post('forgot-password')
  @Public()
  @WriteOperation()
  @RateLimit(PASSWORD_RESET_RATE, HOUR_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Send a password reset link without revealing account existence' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reset email sent if account exists' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: true; message: string }> {
    await this.authService.forgotPassword(dto, this.buildAuditContext(req));
    return {
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @Public()
  @WriteOperation()
  @RateLimit(PASSWORD_RESET_RATE, HOUR_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Reset password using emailed token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: true }> {
    await this.authService.resetPassword(dto, this.buildAuditContext(req));
    return { success: true };
  }

  @Post('change-password')
  @ApiBearerAuth()
  @WriteOperation()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Change the current user password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password changed' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<{ success: true }> {
    await this.authService.changePassword(user.id, dto, {
      ...this.buildAuditContext(req),
      sessionId: user.sessionId,
    });
    return { success: true };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ReadOnlySafe()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessions listed' })
  async listSessions(@CurrentUser() user: AuthenticatedUser): Promise<readonly SessionInfo[]> {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @WriteOperation()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke one session belonging to the current user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Session revoked' })
  async revokeSession(
    @Param('id', ParseUuidPipe) sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.authService.revokeSession(user.id, sessionId, this.buildAuditContext(req));
  }

  @Post('mfa/setup')
  @ApiBearerAuth()
  @WriteOperation()
  @ApiOperation({ summary: 'Generate TOTP secret, QR code, and recovery codes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'MFA setup payload returned' })
  @HttpCode(HttpStatus.OK)
  async mfaSetup(@CurrentUser() user: AuthenticatedUser): Promise<MfaSetupResult> {
    return this.authService.mfaSetup(user.id, user.email);
  }

  @Post('mfa/verify-setup')
  @ApiBearerAuth()
  @WriteOperation()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Confirm MFA setup by submitting a current TOTP code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'MFA verified' })
  @HttpCode(HttpStatus.OK)
  async mfaVerifySetup(
    @Body() dto: EnableMfaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; message?: string }> {
    const valid = await this.authService.mfaVerifySetup(user.id, dto, this.buildAuditContext(req));
    if (!valid) {
      return { success: false, message: 'Invalid code, try again.' };
    }
    return { success: true };
  }

  @Post('mfa/disable')
  @ApiBearerAuth()
  @WriteOperation()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Disable MFA after re-authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'MFA disabled' })
  @HttpCode(HttpStatus.OK)
  async mfaDisable(
    @Body() dto: DisableMfaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<{ success: true }> {
    await this.authService.mfaDisable(user.id, dto, this.buildAuditContext(req));
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ReadOnlySafe()
  @ApiOperation({ summary: 'Return the current authenticated user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile returned' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const fresh = await this.userService.findByIdOrFail(user.id);
    return this.userMapper.toResponse(fresh);
  }

  private buildLoginContext(req: RequestWithUser): {
    ipHash: string;
    userAgent: string | null;
    requestId: string;
    deviceInfo: string | null;
  } {
    const userAgent = req.header(USER_AGENT_HEADER) ?? null;
    return {
      ipHash: req.ipHash,
      userAgent,
      requestId: req.requestId,
      deviceInfo: userAgent,
    };
  }

  private buildAuditContext(req: RequestWithUser): {
    ipHash: string;
    userAgent: string | null;
    requestId: string;
  } {
    return {
      ipHash: req.ipHash,
      userAgent: req.header(USER_AGENT_HEADER) ?? null,
      requestId: req.requestId,
    };
  }

  private isWebClient(req: RequestWithUser): boolean {
    const platform = req.header(CLIENT_PLATFORM_HEADER);
    return typeof platform === 'string' && platform.toLowerCase() === WEB_CLIENT_VALUE;
  }

  private extractRefreshToken(req: RequestWithUser, dto?: RefreshTokenDto): string | null {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const cookieToken = cookies?.[SESSION_COOKIE_NAME];
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }
    if (dto && typeof dto.refreshToken === 'string' && dto.refreshToken.length > 0) {
      return dto.refreshToken;
    }
    return null;
  }

  private applyTokenDelivery(
    req: RequestWithUser,
    res: Response,
    result: AuthResponseDto,
  ): AuthResponseDto {
    if (!this.isWebClient(req)) {
      return result;
    }
    this.setSessionCookie(res, result.refreshToken ?? '', result.expiresIn);
    return { ...result, refreshToken: null };
  }

  private setSessionCookie(res: Response, refreshToken: string, expiresInSeconds: number): void {
    res.cookie(SESSION_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: expiresInSeconds * MS_PER_SECOND,
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  }
}
