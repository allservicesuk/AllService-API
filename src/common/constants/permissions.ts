/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Typed permission constants; every authorization decision is made against one of these codes.
 */
export const Permission = {
  USER_READ_SELF: 'user:read:self',
  USER_READ_TENANT: 'user:read:tenant',
  USER_READ_ANY: 'user:read:any',
  USER_WRITE_SELF: 'user:write:self',
  USER_WRITE_TENANT: 'user:write:tenant',
  USER_WRITE_ANY: 'user:write:any',
  USER_CREATE: 'user:create',
  USER_DELETE: 'user:delete',
  USER_RESTORE: 'user:restore',
  USER_LOCK_TENANT: 'user:lock:tenant',
  USER_LOCK_ANY: 'user:lock:any',
  USER_LIST_TENANT: 'user:list:tenant',
  USER_LIST_ANY: 'user:list:any',
  SESSION_READ_SELF: 'session:read:self',
  SESSION_REVOKE_SELF: 'session:revoke:self',
  SESSION_REVOKE_ANY: 'session:revoke:any',
  MFA_MANAGE_SELF: 'mfa:manage:self',
  AUDIT_READ_TENANT: 'audit:read:tenant',
  AUDIT_READ_ANY: 'audit:read:any',
  CAREER_POSTING_READ: 'career:posting:read',
  CAREER_POSTING_WRITE: 'career:posting:write',
  CAREER_APPLICATION_READ: 'career:application:read',
  CAREER_APPLICATION_WRITE: 'career:application:write',
  CAREER_ANALYTICS_READ: 'career:analytics:read',
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_WRITE: 'webhook:write',
  WEBHOOK_DELETE: 'webhook:delete',
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];
