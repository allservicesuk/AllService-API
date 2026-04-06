/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route so the AuditInterceptor appends an audit log entry after successful execution.
 */
import { SetMetadata } from '@nestjs/common';

export const AUDITED_KEY = 'auditedAction';

export const Audited = (action: string): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUDITED_KEY, action);
