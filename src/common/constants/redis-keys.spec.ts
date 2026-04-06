/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for Redis key templates ensuring correct prefix and structure.
 */
import { RedisKeys } from './redis-keys';

describe('RedisKeys', () => {
  it('should build session key with region, userId, sessionId', () => {
    expect(RedisKeys.session('eu', 'user-1', 'sess-1')).toBe('as:eu:sessions:user-1:sess-1');
    expect(RedisKeys.session('na', 'user-2', 'sess-2')).toBe('as:na:sessions:user-2:sess-2');
  });

  it('should build session pattern with wildcard', () => {
    expect(RedisKeys.sessionPattern('eu', 'user-1')).toBe('as:eu:sessions:user-1:*');
  });

  it('should build rate limit key', () => {
    expect(RedisKeys.rateLimit('eu', '127.0.0.1', '/auth/login')).toBe(
      'as:eu:rl:127.0.0.1:/auth/login',
    );
  });

  it('should build refresh token key', () => {
    expect(RedisKeys.refreshToken('eu', 'hash123')).toBe('as:eu:rt:hash123');
  });

  it('should build refresh token family key', () => {
    expect(RedisKeys.refreshTokenFamily('eu', 'family-1')).toBe('as:eu:rtf:family-1');
  });

  it('should build crypto session key', () => {
    expect(RedisKeys.cryptoSession('na', 'sess-1')).toBe('as:na:crypto:sess-1');
  });

  it('should build lock keys', () => {
    expect(RedisKeys.lockAttempts('eu', 'user-1')).toBe('as:eu:lock:attempts:user-1');
    expect(RedisKeys.lockLocked('eu', 'user-1')).toBe('as:eu:lock:locked:user-1');
  });

  it('should build email verification key', () => {
    expect(RedisKeys.emailVerify('eu', 'token-abc')).toBe('as:eu:verify:token-abc');
  });

  it('should build password reset key', () => {
    expect(RedisKeys.passwordReset('eu', 'token-xyz')).toBe('as:eu:reset:token-xyz');
  });

  it('should build MFA setup key', () => {
    expect(RedisKeys.mfaSetup('na', 'user-1')).toBe('as:na:mfa:setup:user-1');
  });

  it('should build idempotency key', () => {
    expect(RedisKeys.idempotency('eu', 'user-1', 'key-1')).toBe('as:eu:idem:user-1:key-1');
  });

  it('should build cache key', () => {
    expect(RedisKeys.cache('eu', 'users', 'user-1')).toBe('as:eu:cache:users:user-1');
  });

  it('should build feature flag key', () => {
    expect(RedisKeys.featureFlag('eu', 'dark-mode')).toBe('as:eu:ff:dark-mode');
  });

  it('should build region health key', () => {
    expect(RedisKeys.regionHealthStatus('eu')).toBe('as:eu:health:status');
  });

  it('should build replica lag key', () => {
    expect(RedisKeys.replicaLag('na')).toBe('as:na:health:replica-lag');
  });

  it('should build audit dead letter key', () => {
    expect(RedisKeys.auditDeadLetter('eu')).toBe('as:eu:audit:dead-letter');
  });

  it('should always prefix with "as:"', () => {
    const allKeys = [
      RedisKeys.session('eu', 'u', 's'),
      RedisKeys.rateLimit('eu', 'i', 'e'),
      RedisKeys.refreshToken('eu', 'h'),
      RedisKeys.cryptoSession('eu', 's'),
      RedisKeys.lockAttempts('eu', 'i'),
      RedisKeys.emailVerify('eu', 't'),
      RedisKeys.passwordReset('eu', 't'),
      RedisKeys.mfaSetup('eu', 'u'),
      RedisKeys.idempotency('eu', 'u', 'k'),
      RedisKeys.cache('eu', 'm', 'k'),
      RedisKeys.featureFlag('eu', 'f'),
      RedisKeys.regionHealthStatus('eu'),
      RedisKeys.replicaLag('eu'),
      RedisKeys.auditDeadLetter('eu'),
    ];
    for (const key of allKeys) {
      expect(key.startsWith('as:')).toBe(true);
    }
  });
});
