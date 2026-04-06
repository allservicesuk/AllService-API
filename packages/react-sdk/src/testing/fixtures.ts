/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Type-safe fixture factories for all API response types used in tests.
 */
import type { AuthResponse, AuthResponseUser } from '../types/auth';
import type { CareerAnalytics } from '../types/careers-analytics';
import type {
  ApplicationDocumentResponse,
  ApplicationResponse,
  BulkChangeStatusResult,
} from '../types/careers-applications';
import type { MessageResponse } from '../types/careers-messages';
import type { PostingResponse } from '../types/careers-postings';
import type { HealthResponse, ReadinessResponse } from '../types/health';
import type { MfaSetupResult } from '../types/mfa';
import type { SessionInfo } from '../types/sessions';
import type { ListUsersResult, UserResponse } from '../types/users';

let counter = 0;
function nextId(): string {
  counter += 1;
  return `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`;
}

export function createUserFixture(
  overrides?: Partial<UserResponse>,
): UserResponse {
  return {
    id: nextId(),
    email: `user${counter}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    isActive: true,
    isLocked: false,
    lockReason: null,
    lockedUntil: null,
    emailVerified: true,
    mfaEnabled: false,
    tenantId: null,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createAuthUserFixture(
  overrides?: Partial<AuthResponseUser>,
): AuthResponseUser {
  return {
    id: nextId(),
    email: `user${counter}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    emailVerified: true,
    mfaEnabled: false,
    ...overrides,
  };
}

export function createAuthResponseFixture(
  overrides?: Partial<AuthResponse>,
): AuthResponse {
  return {
    accessToken: 'test-access-token',
    refreshToken: null,
    expiresIn: 900,
    tokenType: 'Bearer',
    user: createAuthUserFixture(),
    ...overrides,
  };
}

export function createSessionFixture(
  overrides?: Partial<SessionInfo>,
): SessionInfo {
  return {
    sessionId: nextId(),
    deviceInfo: 'Chrome 120, macOS',
    ipHash: 'abc123def456',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: '2026-01-01T12:00:00.000Z',
    isCurrent: false,
    ...overrides,
  };
}

export function createMfaSetupFixture(
  overrides?: Partial<MfaSetupResult>,
): MfaSetupResult {
  return {
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'otpauth://totp/AllServices:user@example.com?secret=JBSWY3DPEHPK3PXP',
    recoveryCodes: ['abcd-efgh', 'ijkl-mnop', 'qrst-uvwx'],
    ...overrides,
  };
}

export function createPostingFixture(
  overrides?: Partial<PostingResponse>,
): PostingResponse {
  const id = nextId();
  return {
    id,
    title: 'Software Engineer',
    slug: 'software-engineer',
    department: 'Engineering',
    location: 'London, UK',
    type: 'FULL_TIME',
    workMode: 'HYBRID',
    description: 'We are looking for a software engineer.',
    requirements: 'TypeScript, React, Node.js experience required.',
    salaryMin: 60000,
    salaryMax: 90000,
    salaryCurrency: 'GBP',
    cvRequired: true,
    customFields: null,
    status: 'PUBLISHED',
    closesAt: null,
    publishedAt: '2026-01-15T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

export function createApplicationFixture(
  overrides?: Partial<ApplicationResponse>,
): ApplicationResponse {
  return {
    id: nextId(),
    jobPostingId: nextId(),
    applicantName: 'Jane Doe',
    applicantEmail: 'jane@example.com',
    applicantPhone: '+44 7700 900000',
    coverLetter: 'I would love to join your team.',
    customResponses: null,
    status: 'SUBMITTED',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    jobTitle: 'Software Engineer',
    documents: [],
    ...overrides,
  };
}

export function createDocumentFixture(
  overrides?: Partial<ApplicationDocumentResponse>,
): ApplicationDocumentResponse {
  return {
    id: nextId(),
    filename: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 204800,
    createdAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createMessageFixture(
  overrides?: Partial<MessageResponse>,
): MessageResponse {
  return {
    id: nextId(),
    senderType: 'ADMIN',
    senderName: 'HR Team',
    body: 'Thank you for your application.',
    isRead: false,
    createdAt: '2026-02-02T00:00:00.000Z',
    ...overrides,
  };
}

export function createAnalyticsFixture(
  overrides?: Partial<CareerAnalytics>,
): CareerAnalytics {
  return {
    totalPostings: 10,
    publishedPostings: 5,
    totalApplications: 42,
    statusBreakdown: [
      { status: 'SUBMITTED', count: 20 },
      { status: 'UNDER_REVIEW', count: 10 },
      { status: 'HIRED', count: 5 },
      { status: 'REJECTED', count: 7 },
    ],
    topPostings: [
      { postingId: nextId(), title: 'Software Engineer', applicationCount: 15 },
      { postingId: nextId(), title: 'Product Manager', applicationCount: 10 },
    ],
    ...overrides,
  };
}

export function createListUsersResultFixture(
  overrides?: Partial<ListUsersResult>,
): ListUsersResult {
  return {
    items: [createUserFixture(), createUserFixture()],
    total: 2,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

export function createBulkStatusResultFixture(
  overrides?: Partial<BulkChangeStatusResult>,
): BulkChangeStatusResult {
  return {
    succeeded: [nextId(), nextId()],
    failed: [],
    ...overrides,
  };
}

export function createHealthFixture(
  overrides?: Partial<HealthResponse>,
): HealthResponse {
  return {
    status: 'ok',
    uptime: 86400,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createReadinessFixture(
  overrides?: Partial<ReadinessResponse>,
): ReadinessResponse {
  return {
    status: 'ready',
    checks: {
      database: { status: 'up' },
      redis: { status: 'up' },
    },
    ...overrides,
  };
}
