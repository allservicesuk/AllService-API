/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for the internal API guard that protects inter-region endpoints.
 */
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { InternalApiGuard } from './internal-api.guard';

const SECRET = 'a'.repeat(64);

function createGuard(internalApiSecret: string): InternalApiGuard {
  const regionConfig = {
    region: 'eu' as const,
    role: 'primary' as const,
    primaryApiUrl: null,
    internalApiSecret,
    isPrimary: true,
    isReplica: false,
    isWriteCapable: true,
  };
  return new InternalApiGuard(regionConfig);
}

function mockContext(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => () => undefined,
    getClass: () => Object,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => 'http' as const,
  } as unknown as ExecutionContext;
}

describe('InternalApiGuard', () => {
  it('should allow request with valid secret', () => {
    const guard = createGuard(SECRET);
    const ctx = mockContext({ 'x-internal-secret': SECRET });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject request with no secret header', () => {
    const guard = createGuard(SECRET);
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject request with empty secret header', () => {
    const guard = createGuard(SECRET);
    const ctx = mockContext({ 'x-internal-secret': '' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject request with wrong secret', () => {
    const guard = createGuard(SECRET);
    const ctx = mockContext({ 'x-internal-secret': 'b'.repeat(64) });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject request with different length secret', () => {
    const guard = createGuard(SECRET);
    const ctx = mockContext({ 'x-internal-secret': 'short' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject when INTERNAL_API_SECRET is not configured', () => {
    const guard = createGuard('');
    const ctx = mockContext({ 'x-internal-secret': SECRET });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
