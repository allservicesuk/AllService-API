/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Joi validation schema for every environment variable; fails fast with every missing var listed.
 */
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  REGION: Joi.string().valid('eu', 'na').required(),
  REGION_ROLE: Joi.string().valid('primary', 'replica').required(),
  PRIMARY_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('REGION_ROLE', {
      is: 'replica',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
  INTERNAL_API_SECRET: Joi.string().min(32).required(),

  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').required(),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  API_VERSION: Joi.string().default('1'),

  DATABASE_WRITE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  DATABASE_WRITE_POOL_MIN: Joi.number().integer().min(0).default(2),
  DATABASE_WRITE_POOL_MAX: Joi.number()
    .integer()
    .min(1)
    .default((parent: { REGION?: string }) => (parent.REGION === 'eu' ? 25 : 10)),
  DATABASE_READ_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  DATABASE_READ_POOL_MIN: Joi.number().integer().min(0).default(2),
  DATABASE_READ_POOL_MAX: Joi.number().integer().min(1).default(25),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_STATEMENT_TIMEOUT: Joi.number().integer().min(1000).default(30000),

  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_KEY_PREFIX: Joi.string().required(),
  REDIS_MAX_RETRIES: Joi.number().integer().min(0).default(3),

  JWT_PRIVATE_KEY: Joi.string().when('REGION_ROLE', {
    is: 'primary',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_TTL: Joi.number().integer().min(3600).default(2592000),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),

  ARGON2_MEMORY_COST: Joi.number().integer().min(19456).default(65536),
  ARGON2_TIME_COST: Joi.number().integer().min(2).default(3),
  ARGON2_PARALLELISM: Joi.number().integer().min(1).default(4),

  CRYPTO_ENABLED: Joi.boolean().default(true),
  CRYPTO_MASTER_KEY: Joi.string().hex().length(64).required(),
  CRYPTO_MASTER_KEY_V2: Joi.string().hex().length(64).optional().allow(''),
  CRYPTO_ACTIVE_VERSION: Joi.string().valid('v1', 'v2').default('v1'),
  CRYPTO_SESSION_TTL: Joi.number().integer().min(60).default(3600),

  SENTRY_DSN: Joi.string().uri().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  SENTRY_REGION: Joi.string().valid('eu', 'na').required(),

  POSTHOG_API_KEY: Joi.string().optional().allow(''),
  POSTHOG_HOST: Joi.string().uri().default('https://eu.posthog.com'),

  SMTP_HOST: Joi.string().hostname().optional().allow(''),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().email().required(),
  APP_WEB_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://allservices.cc'),

  THROTTLE_GLOBAL_TTL: Joi.number().integer().min(1000).default(60000),
  THROTTLE_GLOBAL_LIMIT: Joi.number().integer().min(1).default(100),

  ALLOWED_ORIGINS: Joi.string().required(),

  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),

  AUDIT_ASYNC_ENABLED: Joi.boolean().default(false),

  CAREERS_UPLOAD_BASE_PATH: Joi.string().default('.tmp/uploads/careers'),
  CAREERS_MAGIC_LINK_TTL_SECONDS: Joi.number().integer().min(60).default(604800),
  CAREERS_VERIFY_CODE_TTL_SECONDS: Joi.number().integer().min(60).default(600),
  CAREERS_APPLY_WEB_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://apply.allservices.cc'),
});

export const configValidationOptions: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: false,
};
