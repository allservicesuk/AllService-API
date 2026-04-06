/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Express Request extension that carries the decoded JWT payload after JwtAuthGuard runs.
 */
import type { Request } from 'express';

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly tenantId: string | null;
  readonly sessionId: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
