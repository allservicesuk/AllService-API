/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Hierarchical query key factory for deterministic cache key generation.
 */
import type { ListApplicationsParams } from '../types/careers-applications';
import type { ListPostingsParams } from '../types/careers-postings';
import type { ListUsersParams } from '../types/users';

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    list: (params: ListUsersParams) =>
      [...queryKeys.users.all, 'list', params] as const,
  },
  careers: {
    postings: {
      all: ['careers', 'postings'] as const,
      publicList: (params: ListPostingsParams) =>
        [...queryKeys.careers.postings.all, 'public', params] as const,
      bySlug: (slug: string) =>
        [...queryKeys.careers.postings.all, 'slug', slug] as const,
      adminList: (params: ListPostingsParams) =>
        [...queryKeys.careers.postings.all, 'admin', params] as const,
      adminDetail: (id: string) =>
        [...queryKeys.careers.postings.all, 'admin', 'detail', id] as const,
    },
    applications: {
      all: ['careers', 'applications'] as const,
      my: () => [...queryKeys.careers.applications.all, 'me'] as const,
      myMessages: () =>
        [...queryKeys.careers.applications.all, 'me', 'messages'] as const,
      adminList: (params: ListApplicationsParams) =>
        [...queryKeys.careers.applications.all, 'admin', params] as const,
      adminDetail: (id: string) =>
        [...queryKeys.careers.applications.all, 'admin', 'detail', id] as const,
      adminMessages: (id: string) =>
        [...queryKeys.careers.applications.all, 'admin', id, 'messages'] as const,
    },
    analytics: () => ['careers', 'analytics'] as const,
  },
  health: {
    all: ['health'] as const,
    check: () => [...queryKeys.health.all, 'check'] as const,
    ready: () => [...queryKeys.health.all, 'ready'] as const,
  },
} as const;
