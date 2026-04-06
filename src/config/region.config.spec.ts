/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Unit tests for region configuration ensuring correct derived flags for each role.
 */
import regionConfig from './region.config';

const loadConfig = (env: Record<string, string>): ReturnType<typeof regionConfig> => {
  const original = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
  const result = (regionConfig as unknown as { (): ReturnType<typeof regionConfig> })();
  process.env = original;
  return result;
};

describe('regionConfig', () => {
  it('should set isPrimary=true for primary role', () => {
    const config = loadConfig({ REGION: 'eu', REGION_ROLE: 'primary', PRIMARY_API_URL: '' });
    expect(config.isPrimary).toBe(true);
    expect(config.isReplica).toBe(false);
    expect(config.isWriteCapable).toBe(true);
  });

  it('should set isReplica=true for replica role', () => {
    const config = loadConfig({
      REGION: 'na',
      REGION_ROLE: 'replica',
      PRIMARY_API_URL: 'http://eu:3000',
    });
    expect(config.isPrimary).toBe(false);
    expect(config.isReplica).toBe(true);
    expect(config.isWriteCapable).toBe(false);
  });

  it('should set primaryApiUrl to null when empty', () => {
    const config = loadConfig({ REGION: 'eu', REGION_ROLE: 'primary', PRIMARY_API_URL: '' });
    expect(config.primaryApiUrl).toBeNull();
  });

  it('should preserve primaryApiUrl when set', () => {
    const config = loadConfig({
      REGION: 'na',
      REGION_ROLE: 'replica',
      PRIMARY_API_URL: 'http://eu:3000',
    });
    expect(config.primaryApiUrl).toBe('http://eu:3000');
  });

  it('should read INTERNAL_API_SECRET', () => {
    const config = loadConfig({
      REGION: 'eu',
      REGION_ROLE: 'primary',
      PRIMARY_API_URL: '',
      INTERNAL_API_SECRET: 'my-secret',
    });
    expect(config.internalApiSecret).toBe('my-secret');
  });

  it('should default internalApiSecret to empty string when not set', () => {
    const config = loadConfig({ REGION: 'eu', REGION_ROLE: 'primary', PRIMARY_API_URL: '' });
    expect(config.internalApiSecret).toBe('');
  });

  it('should expose region as-is', () => {
    const eu = loadConfig({ REGION: 'eu', REGION_ROLE: 'primary', PRIMARY_API_URL: '' });
    expect(eu.region).toBe('eu');
    const na = loadConfig({ REGION: 'na', REGION_ROLE: 'replica', PRIMARY_API_URL: 'http://eu' });
    expect(na.region).toBe('na');
  });

  it('should expose role as-is', () => {
    const config = loadConfig({ REGION: 'eu', REGION_ROLE: 'primary', PRIMARY_API_URL: '' });
    expect(config.role).toBe('primary');
  });
});
