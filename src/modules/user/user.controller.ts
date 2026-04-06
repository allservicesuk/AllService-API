/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * REST controller for /v1/users exposing self and admin routes with permission-based authorization.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ErrorCode, Permission, type PermissionCode } from '@common/constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  CurrentPermissions,
  RequireAnyPermission,
  RequirePermission,
} from '@common/decorators/permissions.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { ReadOnlySafe } from '@common/decorators/read-only-safe.decorator';
import { WriteOperation } from '@common/decorators/write-operation.decorator';
import type {
  AuthenticatedUser,
  RequestWithUser,
} from '@common/interfaces/request-with-user.interface';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe';

import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UserSafe } from './interfaces/user-safe.interface';
import type { AuditContext, ListUsersResult } from './user.service';
import { UserService } from './user.service';
import { UserMapper } from './user.mapper';

const MINUTE_IN_MS = 60_000;
const LIST_RATE_LIMIT = 60;
const CREATE_RATE_LIMIT = 20;
const RATE_LIMIT_TTL_SECONDS = 60;
const USER_AGENT_HEADER = 'user-agent';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @Get('me')
  @ReadOnlySafe()
  @RequirePermission(Permission.USER_READ_SELF)
  @ApiOperation({ summary: 'Return the current authenticated user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile returned' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const fresh = await this.userService.findByIdOrFail(user.id);
    return this.userMapper.toResponse(fresh);
  }

  @Patch('me')
  @WriteOperation()
  @RequirePermission(Permission.USER_WRITE_SELF)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const updated = await this.userService.updateProfile(user.id, dto, this.contextFrom(req));
    return this.userMapper.toResponse(updated);
  }

  @Get(':id')
  @ReadOnlySafe()
  @RequireAnyPermission(
    Permission.USER_READ_SELF,
    Permission.USER_READ_TENANT,
    Permission.USER_READ_ANY,
  )
  @ApiOperation({ summary: 'Return a user by id (self or tenant or any scope)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getById(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
  ): Promise<UserResponseDto> {
    const target = await this.userService.findByIdOrFail(id);
    this.enforceReadScope(target, actor, permissions);
    return this.userMapper.toResponse(target);
  }

  @Get()
  @ReadOnlySafe()
  @RequireAnyPermission(Permission.USER_LIST_TENANT, Permission.USER_LIST_ANY)
  @RateLimit(LIST_RATE_LIMIT, RATE_LIMIT_TTL_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List users with tenant scoping and filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated user list' })
  async list(
    @Query() query: ListUsersDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
  ): Promise<ListUsersResult> {
    const actorSafe = this.toUserSafe(actor);
    return this.userService.list(query, actorSafe, permissions as readonly PermissionCode[]);
  }

  @Post()
  @WriteOperation()
  @RequirePermission(Permission.USER_CREATE)
  @RateLimit(CREATE_RATE_LIMIT, RATE_LIMIT_TTL_SECONDS)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Admin-create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists' })
  async create(
    @Body() dto: AdminCreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const actorSafe = this.toUserSafe(actor);
    const created = await this.userService.adminCreate(dto, actorSafe, this.contextFrom(req));
    return this.userMapper.toResponse(created);
  }

  @Patch(':id')
  @WriteOperation()
  @RequireAnyPermission(Permission.USER_WRITE_TENANT, Permission.USER_WRITE_ANY)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Admin-update a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden field change' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const actorSafe = this.toUserSafe(actor);
    const updated = await this.userService.adminUpdate(
      id,
      dto,
      actorSafe,
      permissions as readonly PermissionCode[],
      this.contextFrom(req),
    );
    return this.userMapper.toResponse(updated);
  }

  @Delete(':id')
  @WriteOperation()
  @RequirePermission(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User soft-deleted' })
  async softDelete(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.userService.softDelete(id, actor.id, this.contextFrom(req));
  }

  @Post(':id/restore')
  @WriteOperation()
  @RequirePermission(Permission.USER_RESTORE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User restored' })
  async restore(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.userService.restore(id, actor.id, this.contextFrom(req));
  }

  @Post(':id/lock')
  @WriteOperation()
  @RequireAnyPermission(Permission.USER_LOCK_TENANT, Permission.USER_LOCK_ANY)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lock a user account' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User locked' })
  async lock(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: LockUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const lockedUntil =
      dto.durationMinutes !== undefined
        ? new Date(Date.now() + dto.durationMinutes * MINUTE_IN_MS)
        : null;
    const hasLockAny = permissions.includes(Permission.USER_LOCK_ANY);
    await this.userService.lock(
      id,
      dto.reason,
      lockedUntil,
      actor.id,
      this.contextFrom(req),
      hasLockAny ? undefined : actor.tenantId,
    );
  }

  @Post(':id/unlock')
  @WriteOperation()
  @RequireAnyPermission(Permission.USER_LOCK_TENANT, Permission.USER_LOCK_ANY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlock a user account' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User unlocked' })
  async unlock(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentPermissions() permissions: readonly string[],
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const hasLockAny = permissions.includes(Permission.USER_LOCK_ANY);
    await this.userService.unlock(
      id,
      actor.id,
      this.contextFrom(req),
      hasLockAny ? undefined : actor.tenantId,
    );
  }

  private enforceReadScope(
    target: UserSafe,
    actor: AuthenticatedUser,
    permissions: readonly string[],
  ): void {
    if (permissions.includes(Permission.USER_READ_ANY)) {
      return;
    }
    if (permissions.includes(Permission.USER_READ_TENANT)) {
      if (target.tenantId !== actor.tenantId) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
      }
      return;
    }
    if (target.id !== actor.id) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
  }

  private toUserSafe(user: AuthenticatedUser): UserSafe {
    return {
      id: user.id,
      email: user.email,
      firstName: null,
      lastName: null,
      roles: user.roles,
      isActive: true,
      isLocked: false,
      lockReason: null,
      lockedUntil: null,
      emailVerified: false,
      mfaEnabled: false,
      tenantId: user.tenantId,
      lastLoginAt: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  }

  private contextFrom(req: RequestWithUser): AuditContext {
    const userAgentHeader = req.header(USER_AGENT_HEADER);
    return {
      ipHash: req.ipHash,
      userAgent: userAgentHeader ?? null,
      requestId: req.requestId,
    };
  }
}
