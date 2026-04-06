/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Listens to User domain events and revokes sessions or logs role changes accordingly.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { generateId } from '@common/utils/id.util';
import regionConfig from '@config/region.config';

import { AuditService, type AuditEntry } from '../../../audit/audit.service';
import { SessionService } from '../session.service';

const SYSTEM_IP_HASH = 'system';
const SYSTEM_USER_AGENT = 'system';

interface UserEventBase {
  readonly userId: string;
  readonly region: string;
}

interface UserLockedEvent extends UserEventBase {
  readonly reason: string;
  readonly lockedUntil: Date | null;
}

interface UserRolesChangedEvent extends UserEventBase {
  readonly oldRoles: readonly string[];
  readonly newRoles: readonly string[];
}

@Injectable()
export class UserEventsListener {
  private readonly logger = new Logger(UserEventsListener.name);

  constructor(
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly sessionService: SessionService,
    private readonly audit: AuditService,
  ) {}

  @OnEvent('user.deactivated')
  async onUserDeactivated(event: UserEventBase): Promise<void> {
    await this.revokeAndLog(event.userId, 'user_deactivated');
  }

  @OnEvent('user.deleted')
  async onUserDeleted(event: UserEventBase): Promise<void> {
    await this.revokeAndLog(event.userId, 'user_deleted');
  }

  @OnEvent('user.locked')
  async onUserLocked(event: UserLockedEvent): Promise<void> {
    await this.revokeAndLog(event.userId, `user_locked:${event.reason}`);
  }

  @OnEvent('user.roles.changed')
  async onUserRolesChanged(event: UserRolesChangedEvent): Promise<void> {
    const entry: AuditEntry = {
      action: 'auth.roles.propagated',
      userId: event.userId,
      resource: `user:${event.userId}`,
      detail: { oldRoles: [...event.oldRoles], newRoles: [...event.newRoles] },
      ipHash: SYSTEM_IP_HASH,
      userAgent: SYSTEM_USER_AGENT,
      region: this.region.region,
      requestId: generateId(),
    };
    await this.audit.log(entry);
    this.logger.log(
      `auth.roles.propagated userId=${event.userId} oldRoles=[${event.oldRoles.join(',')}] newRoles=[${event.newRoles.join(',')}]`,
    );
  }

  private async revokeAndLog(userId: string, reason: string): Promise<void> {
    const context = {
      ipHash: SYSTEM_IP_HASH,
      userAgent: SYSTEM_USER_AGENT,
      requestId: generateId(),
    };
    await this.sessionService.revokeAll(userId, context, reason);
    this.logger.log(`auth.sessions.revoked userId=${userId} reason=${reason}`);
  }
}
