/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Owns every User persistence operation; enforces tenant scoping, audit writes, and domain events.
 */
import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, type PrismaClient } from '@prisma/client';

import { ErrorCode, Permission, Role, type PermissionCode } from '@common/constants';
import regionConfig from '@config/region.config';

import { AuditService } from '../../audit/audit.service';
import { PRISMA_READ, PRISMA_WRITE } from '../../database/database.tokens';
import { PostHogService } from '../../observability/posthog.service';
import { PasswordService } from '../auth/password.service';

import type { AdminCreateUserDto } from './dto/admin-create-user.dto';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { ListUsersDto } from './dto/list-users.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UserSafe } from './interfaces/user-safe.interface';
import type { UserWithSecrets } from './interfaces/user-with-secrets.interface';
import { UserMapper } from './user.mapper';

const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';
const DEFAULT_ROLES: readonly string[] = [Role.USER];

export interface CreateUserData {
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: readonly string[];
  readonly tenantId?: string | null;
  readonly emailVerified?: boolean;
}

export interface AuditContext {
  readonly ipHash: string;
  readonly userAgent: string | null;
  readonly requestId: string;
}

export interface ListUsersResult {
  readonly items: readonly UserResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    private readonly auditService: AuditService,
    private readonly posthog: PostHogService,
    private readonly events: EventEmitter2,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly mapper: UserMapper,
    @Inject(forwardRef(() => PasswordService)) private readonly passwordService: PasswordService,
  ) {}

  async findById(id: string): Promise<UserSafe | null> {
    const user = await this.prismaRead.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.mapper.toSafe(user) : null;
  }

  async findByIdOrFail(id: string): Promise<UserSafe> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserSafe | null> {
    const normalised = this.normaliseEmail(email);
    const user = await this.prismaRead.user.findFirst({
      where: { email: normalised, deletedAt: null },
    });
    return user ? this.mapper.toSafe(user) : null;
  }

  async findByIdWithSecrets(id: string): Promise<UserWithSecrets | null> {
    const user = await this.prismaRead.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.mapper.toWithSecrets(user) : null;
  }

  async findByEmailWithSecrets(email: string): Promise<UserWithSecrets | null> {
    const normalised = this.normaliseEmail(email);
    const user = await this.prismaRead.user.findFirst({
      where: { email: normalised, deletedAt: null },
    });
    return user ? this.mapper.toWithSecrets(user) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const normalised = this.normaliseEmail(email);
    const count = await this.prismaRead.user.count({
      where: { email: normalised, deletedAt: null },
    });
    return count > 0;
  }

  async list(
    query: ListUsersDto,
    actor: UserSafe,
    actorPermissions: readonly PermissionCode[],
  ): Promise<ListUsersResult> {
    const hasListAny = actorPermissions.includes(Permission.USER_LIST_ANY);
    const where = this.buildListWhere(query, actor, hasListAny);
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prismaRead.$transaction([
      this.prismaRead.user.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prismaRead.user.count({ where }),
    ]);
    return {
      items: this.mapper.toResponseList(rows),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async create(data: CreateUserData): Promise<UserSafe> {
    const normalised = this.normaliseEmail(data.email);
    try {
      const created = await this.prismaWrite.user.create({
        data: this.buildCreateInput(data, normalised),
      });
      this.events.emit('user.created', {
        userId: created.id,
        email: created.email,
        region: this.region.region,
      });
      this.posthog.identify(created.id, {
        email: created.email,
        createdAt: created.createdAt.toISOString(),
      });
      return this.mapper.toSafe(created);
    } catch (error) {
      this.rethrowPrisma(error, 'user.create');
    }
  }

  async adminCreate(
    data: AdminCreateUserDto,
    actor: UserSafe,
    context: AuditContext,
  ): Promise<UserSafe> {
    const passwordHash = await this.passwordService.hash(data.password);
    const created = await this.create({
      email: data.email,
      passwordHash,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      roles: data.roles,
      tenantId: data.tenantId ?? null,
      emailVerified: data.emailVerified ?? false,
    });
    await this.writeAudit('user.admin.created', actor.id, created.id, context, {
      actorId: actor.id,
      targetId: created.id,
      email: created.email,
      roles: created.roles,
    });
    this.logger.log(
      `user.admin.created actor=${actor.id} target=${created.id} region=${this.region.region}`,
    );
    return created;
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    context: AuditContext,
  ): Promise<UserSafe> {
    const updateData: Prisma.UserUpdateInput = {};
    const changed: Record<string, unknown> = {};
    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
      changed['firstName'] = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
      changed['lastName'] = data.lastName;
    }
    try {
      const updated = await this.prismaWrite.user.update({
        where: { id: userId },
        data: updateData,
      });
      await this.writeAudit('user.profile.updated', userId, userId, context, changed);
      return this.mapper.toSafe(updated);
    } catch (error) {
      this.rethrowPrisma(error, 'user.updateProfile');
    }
  }

  async adminUpdate(
    userId: string,
    data: AdminUpdateUserDto,
    actor: UserSafe,
    actorPermissions: readonly PermissionCode[],
    context: AuditContext,
  ): Promise<UserSafe> {
    const hasWriteAny = actorPermissions.includes(Permission.USER_WRITE_ANY);
    if (!hasWriteAny) {
      if (data.roles !== undefined) {
        throw new ForbiddenException({
          code: ErrorCode.FORBIDDEN,
          message: 'Insufficient privilege to modify roles',
          detail: { forbidden_field: 'roles' },
        });
      }
      if (data.tenantId !== undefined) {
        throw new ForbiddenException({
          code: ErrorCode.FORBIDDEN,
          message: 'Insufficient privilege to modify tenantId',
          detail: { forbidden_field: 'tenantId' },
        });
      }
    }
    const target = await this.prismaRead.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!target) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
    if (!hasWriteAny && target.tenantId !== actor.tenantId) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
    const updateData: Prisma.UserUpdateInput = {};
    const diff: Record<string, { before: unknown; after: unknown }> = {};
    if (data.firstName !== undefined && data.firstName !== target.firstName) {
      updateData.firstName = data.firstName;
      diff['firstName'] = { before: target.firstName, after: data.firstName };
    }
    if (data.lastName !== undefined && data.lastName !== target.lastName) {
      updateData.lastName = data.lastName;
      diff['lastName'] = { before: target.lastName, after: data.lastName };
    }
    if (data.roles !== undefined) {
      updateData.roles = [...data.roles];
      diff['roles'] = { before: target.roles, after: data.roles };
    }
    if (data.isActive !== undefined && data.isActive !== target.isActive) {
      updateData.isActive = data.isActive;
      diff['isActive'] = { before: target.isActive, after: data.isActive };
    }
    if (data.tenantId !== undefined && data.tenantId !== target.tenantId) {
      updateData.tenant = { connect: { id: data.tenantId } };
      diff['tenantId'] = { before: target.tenantId, after: data.tenantId };
    }
    if (data.emailVerified !== undefined && data.emailVerified !== target.emailVerified) {
      updateData.emailVerified = data.emailVerified;
      diff['emailVerified'] = { before: target.emailVerified, after: data.emailVerified };
    }
    try {
      const updated = await this.prismaWrite.user.update({
        where: { id: userId },
        data: updateData,
      });
      if (data.isActive === false && target.isActive) {
        this.events.emit('user.deactivated', {
          userId: updated.id,
          region: this.region.region,
        });
      }
      if (data.roles !== undefined && !this.rolesEqual(target.roles, data.roles)) {
        this.events.emit('user.roles.changed', {
          userId: updated.id,
          oldRoles: target.roles,
          newRoles: data.roles,
          region: this.region.region,
        });
      }
      await this.writeAudit('user.admin.updated', actor.id, updated.id, context, {
        actorId: actor.id,
        targetId: updated.id,
        diff,
      });
      return this.mapper.toSafe(updated);
    } catch (error) {
      this.rethrowPrisma(error, 'user.adminUpdate');
    }
  }

  async updatePassword(userId: string, passwordHash: string, context: AuditContext): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
      await this.writeAudit('user.password.updated', userId, userId, context, null);
    } catch (error) {
      this.rethrowPrisma(error, 'user.updatePassword');
    }
  }

  async markEmailVerified(userId: string, context: AuditContext): Promise<void> {
    const target = await this.prismaRead.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { emailVerified: true },
    });
    if (!target) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
    if (target.emailVerified) {
      return;
    }
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
      await this.writeAudit('user.email.verified', userId, userId, context, null);
    } catch (error) {
      this.rethrowPrisma(error, 'user.markEmailVerified');
    }
  }

  async recordLoginSuccess(userId: string, ipHash: string): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipHash,
          failedLoginAttempts: 0,
          isLocked: false,
          lockReason: null,
          lockedUntil: null,
        },
      });
    } catch (error) {
      this.rethrowPrisma(error, 'user.recordLoginSuccess');
    }
  }

  async incrementFailedLoginAttempts(userId: string): Promise<number> {
    try {
      const updated = await this.prismaWrite.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });
      return updated.failedLoginAttempts;
    } catch (error) {
      this.rethrowPrisma(error, 'user.incrementFailedLoginAttempts');
    }
  }

  async lock(
    userId: string,
    reason: string,
    until: Date | null,
    actorId: string | null,
    context: AuditContext,
    actorTenantId?: string | null,
  ): Promise<void> {
    if (actorId !== null && actorTenantId !== undefined) {
      const target = await this.prismaRead.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { tenantId: true },
      });
      if (!target || target.tenantId !== actorTenantId) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
      }
    }
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { isLocked: true, lockReason: reason, lockedUntil: until },
      });
      this.events.emit('user.locked', {
        userId,
        reason,
        lockedUntil: until,
        region: this.region.region,
      });
      await this.writeAudit('user.locked', actorId, userId, context, {
        reason,
        lockedUntil: until ? until.toISOString() : null,
        actorId,
      });
    } catch (error) {
      this.rethrowPrisma(error, 'user.lock');
    }
  }

  async unlock(
    userId: string,
    actorId: string,
    context: AuditContext,
    actorTenantId?: string | null,
  ): Promise<void> {
    if (actorTenantId !== undefined) {
      const target = await this.prismaRead.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { tenantId: true },
      });
      if (!target || target.tenantId !== actorTenantId) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
      }
    }
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: {
          isLocked: false,
          lockReason: null,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
      await this.writeAudit('user.unlocked', actorId, userId, context, { actorId });
    } catch (error) {
      this.rethrowPrisma(error, 'user.unlock');
    }
  }

  async setMfaSecret(
    userId: string,
    encryptedSecret: string,
    hashedRecoveryCodes: readonly string[],
    context: AuditContext,
  ): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: {
          mfaSecret: encryptedSecret,
          mfaRecoveryCodes: [...hashedRecoveryCodes],
          mfaEnabled: true,
        },
      });
      await this.writeAudit('user.mfa.secret.set', userId, userId, context, null);
    } catch (error) {
      this.rethrowPrisma(error, 'user.setMfaSecret');
    }
  }

  async clearMfa(userId: string, context: AuditContext): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { mfaSecret: null, mfaRecoveryCodes: [], mfaEnabled: false },
      });
      await this.writeAudit('user.mfa.cleared', userId, userId, context, null);
    } catch (error) {
      this.rethrowPrisma(error, 'user.clearMfa');
    }
  }

  async consumeRecoveryCode(userId: string, hashedCode: string): Promise<void> {
    const target = await this.prismaRead.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { mfaRecoveryCodes: true },
    });
    if (!target) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
    }
    const index = target.mfaRecoveryCodes.indexOf(hashedCode);
    if (index === -1) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'RECOVERY_CODE_NOT_FOUND',
      });
    }
    const remaining = [...target.mfaRecoveryCodes];
    remaining.splice(index, 1);
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { mfaRecoveryCodes: remaining },
      });
    } catch (error) {
      this.rethrowPrisma(error, 'user.consumeRecoveryCode');
    }
  }

  async softDelete(userId: string, actorId: string, context: AuditContext): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), isActive: false },
      });
      this.events.emit('user.deleted', { userId, region: this.region.region });
      await this.writeAudit('user.deleted', actorId, userId, context, { actorId });
    } catch (error) {
      this.rethrowPrisma(error, 'user.softDelete');
    }
  }

  async restore(userId: string, actorId: string, context: AuditContext): Promise<void> {
    try {
      await this.prismaWrite.user.update({
        where: { id: userId },
        data: { deletedAt: null, isActive: true },
      });
      await this.writeAudit('user.restored', actorId, userId, context, { actorId });
    } catch (error) {
      this.rethrowPrisma(error, 'user.restore');
    }
  }

  private normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildCreateInput(data: CreateUserData, normalisedEmail: string): Prisma.UserCreateInput {
    const input: Prisma.UserCreateInput = {
      email: normalisedEmail,
      passwordHash: data.passwordHash,
      roles: data.roles ? [...data.roles] : [...DEFAULT_ROLES],
      isActive: true,
      isLocked: false,
      emailVerified: data.emailVerified ?? false,
    };
    if (data.firstName !== undefined) {
      input.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      input.lastName = data.lastName;
    }
    if (data.tenantId !== undefined && data.tenantId !== null) {
      input.tenant = { connect: { id: data.tenantId } };
    }
    return input;
  }

  private buildListWhere(
    query: ListUsersDto,
    actor: UserSafe,
    hasListAny: boolean,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (hasListAny) {
      if (!query.includeDeleted) {
        where.deletedAt = null;
      }
      if (query.tenantId !== undefined) {
        where.tenantId = query.tenantId;
      }
    } else {
      where.deletedAt = null;
      where.tenantId = actor.tenantId;
    }
    if (query.search !== undefined && query.search.length > 0) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role !== undefined) {
      where.roles = { has: query.role };
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.isLocked !== undefined) {
      where.isLocked = query.isLocked;
    }
    return where;
  }

  private rolesEqual(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    for (let i = 0; i < sortedA.length; i += 1) {
      if (sortedA[i] !== sortedB[i]) {
        return false;
      }
    }
    return true;
  }

  private async writeAudit(
    action: string,
    actorId: string | null,
    _targetId: string,
    context: AuditContext,
    detail: Record<string, unknown> | null,
  ): Promise<void> {
    await this.auditService.log({
      action,
      userId: actorId,
      resource: 'user',
      detail,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
      region: this.region.region,
      requestId: context.requestId,
    });
  }

  private rethrowPrisma(error: unknown, operation: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PRISMA_UNIQUE_VIOLATION) {
        throw new ConflictException({
          code: ErrorCode.EMAIL_ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }
      if (error.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'USER_NOT_FOUND' });
      }
    }
    this.logger.error(
      `${operation}.failed reason=${error instanceof Error ? error.message : 'unknown'}`,
    );
    throw error;
  }
}
