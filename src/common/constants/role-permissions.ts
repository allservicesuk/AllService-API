/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Roles are named bundles of permissions; JWT issuance flattens this map into the access token.
 */
import { Permission, type PermissionCode } from './permissions';

export const Role = {
  USER: 'user',
  TENANT_ADMIN: 'tenant-admin',
  ADMIN: 'admin',
} as const;

export type RoleCode = (typeof Role)[keyof typeof Role];

export const ROLE_PERMISSIONS: Record<RoleCode, readonly PermissionCode[]> = {
  [Role.USER]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.MFA_MANAGE_SELF,
  ],
  [Role.TENANT_ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.USER_READ_TENANT,
    Permission.USER_WRITE_TENANT,
    Permission.USER_LIST_TENANT,
    Permission.USER_LOCK_TENANT,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.MFA_MANAGE_SELF,
    Permission.AUDIT_READ_TENANT,
  ],
  [Role.ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.USER_READ_ANY,
    Permission.USER_WRITE_ANY,
    Permission.USER_CREATE,
    Permission.USER_DELETE,
    Permission.USER_RESTORE,
    Permission.USER_LIST_ANY,
    Permission.USER_LOCK_ANY,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.SESSION_REVOKE_ANY,
    Permission.MFA_MANAGE_SELF,
    Permission.AUDIT_READ_ANY,
    Permission.CAREER_POSTING_READ,
    Permission.CAREER_POSTING_WRITE,
    Permission.CAREER_APPLICATION_READ,
    Permission.CAREER_APPLICATION_WRITE,
    Permission.CAREER_ANALYTICS_READ,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_WRITE,
    Permission.WEBHOOK_DELETE,
  ],
} as const;

export function flattenRoles(roles: readonly string[]): PermissionCode[] {
  const set = new Set<PermissionCode>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as RoleCode];
    if (!perms) {
      continue;
    }
    for (const perm of perms) {
      set.add(perm);
    }
  }
  return [...set];
}
