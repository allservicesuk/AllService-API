/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Template functions for every Redis key; services never concatenate key strings by hand.
 */
export const RedisKeys = {
  session: (region: string, userId: string, sessionId: string): string =>
    `as:${region}:sessions:${userId}:${sessionId}`,
  sessionPattern: (region: string, userId: string): string => `as:${region}:sessions:${userId}:*`,
  rateLimit: (region: string, identifier: string, endpoint: string): string =>
    `as:${region}:rl:${identifier}:${endpoint}`,
  refreshToken: (region: string, tokenHash: string): string => `as:${region}:rt:${tokenHash}`,
  refreshTokenFamily: (region: string, familyId: string): string => `as:${region}:rtf:${familyId}`,
  cryptoSession: (region: string, sessionId: string): string => `as:${region}:crypto:${sessionId}`,
  lockAttempts: (region: string, identifier: string): string =>
    `as:${region}:lock:attempts:${identifier}`,
  lockLocked: (region: string, identifier: string): string =>
    `as:${region}:lock:locked:${identifier}`,
  emailVerify: (region: string, token: string): string => `as:${region}:verify:${token}`,
  passwordReset: (region: string, token: string): string => `as:${region}:reset:${token}`,
  mfaSetup: (region: string, userId: string): string => `as:${region}:mfa:setup:${userId}`,
  idempotency: (region: string, userId: string, key: string): string =>
    `as:${region}:idem:${userId}:${key}`,
  cache: (region: string, module: string, key: string): string =>
    `as:${region}:cache:${module}:${key}`,
  featureFlag: (region: string, flagName: string): string => `as:${region}:ff:${flagName}`,
  regionHealthStatus: (region: string): string => `as:${region}:health:status`,
  replicaLag: (region: string): string => `as:${region}:health:replica-lag`,
  auditDeadLetter: (region: string): string => `as:${region}:audit:dead-letter`,
  careerVerifyCode: (region: string, email: string, jobPostingId: string): string =>
    `as:${region}:career:verify:${email}:${jobPostingId}`,
  careerMagicLink: (region: string, tokenHash: string): string =>
    `as:${region}:career:magic:${tokenHash}`,
  careerDraftPrunePattern: (region: string): string => `as:${region}:career:draft:*`,
} as const;
