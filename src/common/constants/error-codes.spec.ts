/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for error code constants ensuring uniqueness and string type.
 */
import { ErrorCode, type ErrorCodeValue } from './error-codes';

describe('ErrorCode', () => {
  it('should have unique values for every key', () => {
    const values = Object.values(ErrorCode);
    const unique = new Set(values);
    expect(values.length).toBe(unique.size);
  });

  it('should only contain string values', () => {
    for (const [key, value] of Object.entries(ErrorCode)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(key).toBe(value);
    }
  });

  it('should use SCREAMING_SNAKE_CASE for all codes', () => {
    for (const value of Object.values(ErrorCode)) {
      expect(value).toMatch(/^[A-Z][A-Z0-9_]+$/);
    }
  });

  it('should include all critical auth error codes', () => {
    const authCodes: ErrorCodeValue[] = [
      ErrorCode.INVALID_CREDENTIALS,
      ErrorCode.ACCOUNT_LOCKED,
      ErrorCode.ACCOUNT_DISABLED,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCode.TOKEN_INVALID,
      ErrorCode.TOKEN_REVOKED,
      ErrorCode.REFRESH_TOKEN_REUSED,
      ErrorCode.MFA_REQUIRED,
      ErrorCode.MFA_INVALID,
      ErrorCode.SESSION_EXPIRED,
      ErrorCode.SESSION_REVOKED,
      ErrorCode.PASSWORD_TOO_WEAK,
      ErrorCode.EMAIL_ALREADY_EXISTS,
    ];
    for (const code of authCodes) {
      expect(Object.values(ErrorCode)).toContain(code);
    }
  });

  it('should include all HTTP-level error codes', () => {
    const httpCodes: ErrorCodeValue[] = [
      ErrorCode.NOT_FOUND,
      ErrorCode.VALIDATION_FAILED,
      ErrorCode.FORBIDDEN,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.RATE_LIMITED,
      ErrorCode.CONFLICT,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.REQUEST_TIMEOUT,
    ];
    for (const code of httpCodes) {
      expect(Object.values(ErrorCode)).toContain(code);
    }
  });
});
