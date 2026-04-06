/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * MSW v2 request handlers for all API endpoints with default fixture responses.
 */
import {
  createAnalyticsFixture,
  createApplicationFixture,
  createAuthResponseFixture,
  createHealthFixture,
  createListUsersResultFixture,
  createMessageFixture,
  createMfaSetupFixture,
  createPostingFixture,
  createReadinessFixture,
  createSessionFixture,
} from './fixtures';

interface HttpHandler {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly body: unknown;
}

function wrapEnvelope(data: unknown): object {
  return {
    data,
    meta: {
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      region: 'eu',
    },
  };
}

function handler(
  method: string,
  path: string,
  data: unknown,
  status = 200,
): HttpHandler {
  return { method, path, status, body: wrapEnvelope(data) };
}

function handler204(method: string, path: string): HttpHandler {
  return { method, path, status: 204, body: null };
}

export function createMswHandlerDefinitions(): readonly HttpHandler[] {
  const posting = createPostingFixture();
  const application = createApplicationFixture();
  const message = createMessageFixture();
  const session = createSessionFixture({ isCurrent: true });
  const listPostings = { data: [posting], total: 1 };
  const listApplications = { data: [application], total: 1 };

  return [
    handler('POST', '/v1/auth/register', createAuthResponseFixture()),
    handler('POST', '/v1/auth/login', createAuthResponseFixture()),
    handler('POST', '/v1/auth/refresh', {
      accessToken: 'new-token',
      refreshToken: null,
      expiresIn: 900,
    }),
    handler204('POST', '/v1/auth/logout'),
    handler204('POST', '/v1/auth/logout-all'),
    handler('POST', '/v1/auth/verify-email', { success: true }),
    handler('POST', '/v1/auth/forgot-password', {
      success: true,
      message: 'If an account exists, a reset email was sent.',
    }),
    handler('POST', '/v1/auth/reset-password', { success: true }),
    handler('POST', '/v1/auth/change-password', { success: true }),
    handler('GET', '/v1/auth/sessions', [session]),
    handler204('DELETE', '/v1/auth/sessions/:id'),
    handler('POST', '/v1/auth/mfa/setup', createMfaSetupFixture()),
    handler('POST', '/v1/auth/mfa/verify-setup', { success: true }),
    handler('POST', '/v1/auth/mfa/disable', { success: true }),

    handler('GET', '/v1/users/me', createListUsersResultFixture().items[0]!),
    handler('PATCH', '/v1/users/me', createListUsersResultFixture().items[0]!),
    handler204('DELETE', '/v1/users/me'),
    handler('GET', '/v1/users/:id', createListUsersResultFixture().items[0]!),
    handler('GET', '/v1/users', createListUsersResultFixture()),
    handler('POST', '/v1/users', createListUsersResultFixture().items[0]!),
    handler('PATCH', '/v1/users/:id', createListUsersResultFixture().items[0]!),
    handler204('DELETE', '/v1/users/:id'),
    handler204('POST', '/v1/users/:id/restore'),
    handler204('POST', '/v1/users/:id/lock'),
    handler204('POST', '/v1/users/:id/unlock'),

    handler('GET', '/v1/careers/postings', listPostings),
    handler('GET', '/v1/careers/postings/:slug', posting),

    handler('POST', '/v1/careers/applications/verify-email', { sent: true }),
    handler('POST', '/v1/careers/applications', application),
    handler('POST', '/v1/careers/applications/access', { sent: true }),
    handler('GET', '/v1/careers/applications/me', application),
    handler('GET', '/v1/careers/applications/me/messages', [message]),
    handler('POST', '/v1/careers/applications/me/messages', message),
    handler('POST', '/v1/careers/applications/me/withdraw', {
      ...application,
      status: 'WITHDRAWN',
    }),

    handler('POST', '/v1/careers/admin/postings', posting),
    handler('GET', '/v1/careers/admin/postings', listPostings),
    handler('GET', '/v1/careers/admin/postings/:id', posting),
    handler('PATCH', '/v1/careers/admin/postings/:id', posting),
    handler('POST', '/v1/careers/admin/postings/:id/publish', {
      ...posting,
      status: 'PUBLISHED',
    }),
    handler('POST', '/v1/careers/admin/postings/:id/close', {
      ...posting,
      status: 'CLOSED',
    }),
    handler('POST', '/v1/careers/admin/postings/:id/archive', {
      ...posting,
      status: 'ARCHIVED',
    }),
    handler('GET', '/v1/careers/admin/applications', listApplications),
    handler('GET', '/v1/careers/admin/applications/:id', application),
    handler('PATCH', '/v1/careers/admin/applications/:id/status', application),
    handler('POST', '/v1/careers/admin/applications/bulk-status', {
      succeeded: [application.id],
      failed: [],
    }),
    handler('GET', '/v1/careers/admin/applications/:id/messages', [message]),
    handler('POST', '/v1/careers/admin/applications/:id/messages', message),
    handler('GET', '/v1/careers/admin/analytics', createAnalyticsFixture()),

    handler('GET', '/v1/health', createHealthFixture()),
    handler('GET', '/v1/health/ready', createReadinessFixture()),
  ];
}
