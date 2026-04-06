/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for TokenService covering local signing, remote delegation, and token verification.
 */
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenService } from './token.service';
import type { JwtPayload, JwtSignInput } from './interfaces/jwt-payload.interface';

const MOCK_JWT_CONFIG = {
  publicKey: 'test-public-key',
  privateKey: 'test-private-key',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 2592000,
  issuer: 'allservices',
  audience: 'allservices-api',
};

const MOCK_SIGN_INPUT: JwtSignInput = {
  sub: 'user-123',
  email: 'test@example.com',
  roles: ['user'],
  permissions: ['user:read:self'],
  tenantId: null,
  jti: 'session-456',
};

function createService(
  overrides: { isPrimary?: boolean; primaryApiUrl?: string | null; internalApiSecret?: string } = {},
): { service: TokenService; jwtService: jest.Mocked<JwtService> } {
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const regionConfig = {
    region: overrides.isPrimary === false ? 'na' : 'eu',
    role: overrides.isPrimary === false ? 'replica' : 'primary',
    primaryApiUrl: overrides.primaryApiUrl ?? null,
    internalApiSecret: overrides.internalApiSecret ?? 'secret-32chars-minimum-length-ok',
    isPrimary: overrides.isPrimary !== false,
    isReplica: overrides.isPrimary === false,
    isWriteCapable: overrides.isPrimary !== false,
  };

  const service = new TokenService(
    MOCK_JWT_CONFIG as never,
    regionConfig as never,
    jwtService,
  );

  return { service, jwtService };
}

describe('TokenService', () => {
  describe('generateAccessToken (primary)', () => {
    it('should sign locally when running as primary', async () => {
      const { service, jwtService } = createService();
      const token = await service.generateAccessToken(MOCK_SIGN_INPUT);
      expect(token).toBe('signed-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: MOCK_SIGN_INPUT.sub,
          email: MOCK_SIGN_INPUT.email,
          jti: MOCK_SIGN_INPUT.jti,
        }),
        expect.objectContaining({
          privateKey: 'test-private-key',
          algorithm: 'RS256',
        }),
      );
    });

    it('should throw when private key is missing on primary', async () => {
      const { service } = createService();
      const jwtConfig = { ...MOCK_JWT_CONFIG, privateKey: '' };
      const brokenService = new TokenService(
        jwtConfig as never,
        {
          region: 'eu',
          role: 'primary',
          primaryApiUrl: null,
          internalApiSecret: '',
          isPrimary: true,
          isReplica: false,
          isWriteCapable: true,
        } as never,
        {} as never,
      );
      await expect(brokenService.generateAccessToken(MOCK_SIGN_INPUT)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generateAccessToken (replica)', () => {
    it('should throw when PRIMARY_API_URL is not configured', async () => {
      const { service } = createService({ isPrimary: false, primaryApiUrl: null });
      await expect(service.generateAccessToken(MOCK_SIGN_INPUT)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw when INTERNAL_API_SECRET is not configured', async () => {
      const { service } = createService({
        isPrimary: false,
        primaryApiUrl: 'http://eu:3000',
        internalApiSecret: '',
      });
      await expect(service.generateAccessToken(MOCK_SIGN_INPUT)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a 128-character hex string', () => {
      const { service } = createService();
      const token = service.generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const { service } = createService();
      const tokens = new Set(Array.from({ length: 100 }, () => service.generateRefreshToken()));
      expect(tokens.size).toBe(100);
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload on valid token', async () => {
      const mockPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['user:read:self'],
        tenantId: null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: 'allservices',
        aud: 'allservices-api',
        jti: 'session-456',
      };
      const { service, jwtService } = createService();
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      const result = await service.verifyAccessToken('valid-token');
      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      const { service, jwtService } = createService();
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));
      await expect(service.verifyAccessToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('decodeWithoutVerification', () => {
    it('should return payload without verification', () => {
      const { service, jwtService } = createService();
      const mockPayload = { sub: 'user-123', jti: 'sess-1' };
      jwtService.decode.mockReturnValue(mockPayload);
      const result = service.decodeWithoutVerification('any-token');
      expect(result).toEqual(mockPayload);
    });

    it('should return null for non-decodable token', () => {
      const { service, jwtService } = createService();
      jwtService.decode.mockReturnValue(null);
      expect(service.decodeWithoutVerification('garbage')).toBeNull();
    });
  });

  describe('getAccessTtlSeconds', () => {
    it('should return configured TTL', () => {
      const { service } = createService();
      expect(service.getAccessTtlSeconds()).toBe(900);
    });
  });
});
