/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for role-permission mapping and flattenRoles utility.
 */
import { Permission, type PermissionCode } from './permissions';
import { flattenRoles, Role, ROLE_PERMISSIONS, type RoleCode } from './role-permissions';

describe('ROLE_PERMISSIONS', () => {
  it('should define permissions for every role', () => {
    const roles = Object.values(Role);
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it('should only contain valid PermissionCode values', () => {
    const allPermissions = new Set<string>(Object.values(Permission));
    for (const role of Object.values(Role)) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        expect(allPermissions.has(perm)).toBe(true);
      }
    }
  });

  it('should map every PermissionCode to at least one role', () => {
    const assignedPermissions = new Set<PermissionCode>();
    for (const role of Object.values(Role)) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        assignedPermissions.add(perm);
      }
    }
    for (const perm of Object.values(Permission)) {
      expect(assignedPermissions.has(perm)).toBe(true);
    }
  });

  it('should give ADMIN a superset of USER permissions', () => {
    const userPerms = new Set(ROLE_PERMISSIONS[Role.USER]);
    const adminPerms = new Set(ROLE_PERMISSIONS[Role.ADMIN]);
    for (const perm of userPerms) {
      expect(adminPerms.has(perm)).toBe(true);
    }
  });
});

describe('flattenRoles', () => {
  it('should return an empty array for no roles', () => {
    expect(flattenRoles([])).toEqual([]);
  });

  it('should return permissions for a single role', () => {
    const result = flattenRoles([Role.USER]);
    expect(result).toEqual(expect.arrayContaining(ROLE_PERMISSIONS[Role.USER] as unknown as PermissionCode[]));
    expect(result.length).toBe(ROLE_PERMISSIONS[Role.USER].length);
  });

  it('should deduplicate permissions across multiple roles', () => {
    const result = flattenRoles([Role.USER, Role.ADMIN]);
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });

  it('should contain the union of all role permissions', () => {
    const result = flattenRoles([Role.USER, Role.ADMIN]);
    const resultSet = new Set(result);
    for (const perm of ROLE_PERMISSIONS[Role.USER]) {
      expect(resultSet.has(perm)).toBe(true);
    }
    for (const perm of ROLE_PERMISSIONS[Role.ADMIN]) {
      expect(resultSet.has(perm)).toBe(true);
    }
  });

  it('should ignore unknown role strings without throwing', () => {
    const result = flattenRoles(['user', 'nonexistent-role' as RoleCode]);
    expect(result.length).toBe(ROLE_PERMISSIONS[Role.USER].length);
  });

  it('should handle duplicate role inputs', () => {
    const single = flattenRoles([Role.USER]);
    const doubled = flattenRoles([Role.USER, Role.USER]);
    expect(doubled.length).toBe(single.length);
  });
});
