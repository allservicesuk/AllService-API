# AllServices API — Master Implementation Plan

Version: 1.1
Author: linkst
Scope: Foundation infrastructure + User module (first business module) + Auth module
Result: A fully functional, deployed, multi-region API with complete user management and authentication

Everything in this plan is literal. Every file, every field, every command.
No ambiguity. No "implement later". No stubs. No shortcuts.

---

## Phase 0: Project Initialisation

### 0.1 — Scaffold

Run:
```bash
npx @nestjs/cli new allservices-api --strict --package-manager pnpm
```

Delete all generated boilerplate: `app.controller.ts`, `app.controller.spec.ts`, `app.service.ts`. Keep only `app.module.ts` (will be rewritten) and `main.ts` (will be rewritten).

Pin Node.js version. Create `.nvmrc`:
```
22
```

Pin pnpm version in `package.json`:
```json
{
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=22.0.0"
  }
}
```

Create `.editorconfig`:
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### 0.2 — TypeScript Configuration

Replace `tsconfig.json` entirely:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@database/*": ["src/database/*"],
      "@guards/*": ["src/common/guards/*"],
      "@interceptors/*": ["src/common/interceptors/*"],
      "@filters/*": ["src/common/filters/*"],
      "@decorators/*": ["src/common/decorators/*"],
      "@pipes/*": ["src/common/pipes/*"],
      "@types/*": ["src/common/types/*"]
    },
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

Create `tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### 0.3 — ESLint + Prettier + Husky + Commitlint

ESLint config (`.eslintrc.js`):
- Parser: `@typescript-eslint/parser`.
- Plugins: `@typescript-eslint`, `prettier`.
- Rules: `no-explicit-any` as error. `no-unused-vars` as error with `argsIgnorePattern: "^_"`. `explicit-function-return-type` as error on exported functions. `no-console` as error (forces Pino, not console.log). `no-floating-promises` as error (every async must be awaited or `.catch()`-ed). All Prettier conflicts disabled via `eslint-config-prettier`.

Prettier config (`.prettierrc`):
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Husky setup:
```bash
pnpm exec husky init
```
- `.husky/pre-commit`: runs `pnpm exec lint-staged`.
- `.husky/commit-msg`: runs `pnpm exec commitlint --edit $1`.

lint-staged in `package.json`:
```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

Commitlint config (`commitlint.config.js`):
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'ci', 'perf', 'build'
    ]],
  },
};
```

### 0.4 — Dependencies

Production:
```
@nestjs/core @nestjs/common @nestjs/platform-express
@nestjs/config @nestjs/swagger
@nestjs/jwt @nestjs/passport
@nestjs/throttler @nestjs/terminus
@nestjs/event-emitter @nestjs/bullmq
@prisma/client ioredis
passport passport-jwt
helmet cookie-parser
class-validator class-transformer
sanitize-html argon2
nestjs-pino pino pino-http
@sentry/node @sentry/profiling-node
posthog-node prom-client
bullmq joi date-fns
otplib qrcode
```

Dev:
```
prisma
@types/node @types/express @types/cookie-parser
@types/sanitize-html @types/passport-jwt @types/qrcode
@nestjs/cli @nestjs/schematics @nestjs/testing
@typescript-eslint/eslint-plugin @typescript-eslint/parser
eslint prettier eslint-config-prettier eslint-plugin-prettier
husky lint-staged
@commitlint/cli @commitlint/config-conventional
jest @types/jest ts-jest
supertest @types/supertest
```

After install: run `pnpm audit`. Zero high or critical vulnerabilities before proceeding.

### 0.5 — Git

`.gitignore`:
```
node_modules
dist
.env
.env.*
!.env.example
coverage
*.log
.DS_Store
.turbo
.pnpm-debug.log
```

Create `.env.example` with every variable listed (placeholder values, descriptions as inline comments). This file is the single reference for what env vars exist.

First commit: `chore: initial project scaffold`.

### 0.6 — Folder Structure

Create every directory now, even if files come later. Use `.gitkeep` in empty directories so git tracks them.

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── constants/
│   │   ├── index.ts
│   │   ├── error-codes.ts
│   │   ├── headers.ts
│   │   ├── redis-keys.ts
│   │   └── regions.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── permissions.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   ├── current-region.decorator.ts
│   │   ├── rate-limit.decorator.ts
│   │   ├── idempotent.decorator.ts
│   │   ├── encrypted.decorator.ts
│   │   ├── write-operation.decorator.ts
│   │   └── read-only-safe.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── permissions.guard.ts
│   │   ├── throttler-behind-proxy.guard.ts
│   │   └── write-region.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── timeout.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   ├── encryption.interceptor.ts
│   │   ├── serializer.interceptor.ts
│   │   ├── idempotency.interceptor.ts
│   │   └── region.interceptor.ts
│   ├── filters/
│   │   ├── all-exceptions.filter.ts
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   ├── parse-uuid.pipe.ts
│   │   └── sanitize.pipe.ts
│   ├── middleware/
│   │   ├── request-id.middleware.ts
│   │   ├── correlation-id.middleware.ts
│   │   └── real-ip.middleware.ts
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   ├── sort.dto.ts
│   │   └── api-response.dto.ts
│   ├── interfaces/
│   │   ├── request-with-user.interface.ts
│   │   ├── request-with-region.interface.ts
│   │   ├── paginated-result.interface.ts
│   │   └── service-response.interface.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── branded-types.ts
│   └── utils/
│       ├── hash.util.ts
│       ├── crypto.util.ts
│       ├── time.util.ts
│       ├── redact.util.ts
│       └── id.util.ts
├── config/
│   ├── config.schema.ts
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   ├── argon2.config.ts
│   ├── crypto.config.ts
│   ├── sentry.config.ts
│   ├── posthog.config.ts
│   ├── mail.config.ts
│   ├── throttle.config.ts
│   ├── cors.config.ts
│   └── region.config.ts
├── database/
│   ├── database.module.ts
│   ├── prisma-write.service.ts
│   ├── prisma-read.service.ts
│   ├── prisma.health.ts
│   └── seeds/
├── redis/
│   ├── redis.module.ts
│   ├── redis.service.ts
│   └── redis.health.ts
├── crypto/
│   ├── crypto.module.ts
│   ├── crypto.service.ts
│   ├── key-exchange.service.ts
│   └── key-store.service.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.service.ts
│   └── audit.interceptor.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts
├── mail/
│   ├── mail.module.ts
│   ├── mail.service.ts
│   └── templates/
├── queue/
│   ├── queue.module.ts
│   └── processors/
├── region/
│   ├── region.module.ts
│   ├── region.service.ts
│   └── region.health.ts
├── observability/
│   ├── observability.module.ts
│   ├── sentry.service.ts
│   ├── posthog.service.ts
│   └── metrics.service.ts
├── modules/
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.mapper.ts
│   │   ├── dto/
│   │   │   ├── update-profile.dto.ts
│   │   │   ├── admin-create-user.dto.ts
│   │   │   ├── admin-update-user.dto.ts
│   │   │   ├── list-users.dto.ts
│   │   │   ├── lock-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── interfaces/
│   │   │   ├── user-safe.interface.ts
│   │   │   └── user-with-secrets.interface.ts
│   │   └── guards/
│   │       └── self-or-admin.guard.ts
│   └── auth/
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── token.service.ts
│       ├── password.service.ts
│       ├── mfa.service.ts
│       ├── session.service.ts
│       ├── strategies/
│       │   └── jwt.strategy.ts
│       ├── listeners/
│       │   └── user-events.listener.ts
│       ├── dto/
│       │   ├── register.dto.ts
│       │   ├── login.dto.ts
│       │   ├── refresh-token.dto.ts
│       │   ├── forgot-password.dto.ts
│       │   ├── reset-password.dto.ts
│       │   ├── change-password.dto.ts
│       │   ├── verify-email.dto.ts
│       │   ├── enable-mfa.dto.ts
│       │   ├── verify-mfa.dto.ts
│       │   └── auth-response.dto.ts
│       ├── interfaces/
│       │   ├── jwt-payload.interface.ts
│       │   └── token-pair.interface.ts
│       └── guards/
│           └── mfa.guard.ts
├── prisma/
│   └── schema.prisma
└── test/
    ├── helpers/
    │   ├── auth.helper.ts
    │   ├── db.helper.ts
    │   ├── redis.helper.ts
    │   └── factory.helper.ts
    ├── jest-e2e.json
    └── jest.setup.ts
```

---

## Phase 1: Configuration

### 1.1 — Config Schema (`src/config/config.schema.ts`)

Joi validation object. Every env var validated. `abortEarly: false` so ALL missing vars are reported at once. The app prints every failure and exits with code 1. No silent defaults for secrets.

Variables needed for foundation + auth:

Region group: `REGION`, `REGION_ROLE`, `PRIMARY_API_URL` (conditional), `INTERNAL_API_SECRET`.
App group: `NODE_ENV`, `PORT`, `API_VERSION`.
Database write group: `DATABASE_WRITE_URL`, `DATABASE_WRITE_POOL_MIN`, `DATABASE_WRITE_POOL_MAX`.
Database read group: `DATABASE_READ_URL`, `DATABASE_READ_POOL_MIN`, `DATABASE_READ_POOL_MAX`.
Database common: `DATABASE_SSL`, `DATABASE_STATEMENT_TIMEOUT`.
Redis group: `REDIS_URL`, `REDIS_TLS`, `REDIS_KEY_PREFIX`, `REDIS_MAX_RETRIES`.
JWT group: `JWT_PRIVATE_KEY` (conditional), `JWT_PUBLIC_KEY`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `JWT_ISSUER`, `JWT_AUDIENCE`.
Argon2 group: `ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM`.
Crypto group: `CRYPTO_ENABLED`, `CRYPTO_MASTER_KEY`, `CRYPTO_MASTER_KEY_V2` (optional — rotation), `CRYPTO_ACTIVE_VERSION` (default `v1`), `CRYPTO_SESSION_TTL` (seconds).
Sentry group: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_REGION`.
PostHog group: `POSTHOG_API_KEY`, `POSTHOG_HOST`.
Mail group: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_WEB_URL` (e.g. `https://allservices.cc`, used to build links in emails).
Throttle group: `THROTTLE_GLOBAL_TTL`, `THROTTLE_GLOBAL_LIMIT`.
CORS group: `ALLOWED_ORIGINS`.
Logging: `LOG_LEVEL`.
Queue group: `AUDIT_ASYNC_ENABLED` (boolean, default `false`).

Conditional logic:
- `JWT_PRIVATE_KEY` required only when `REGION_ROLE` is `primary`.
- `PRIMARY_API_URL` required only when `REGION_ROLE` is `replica`.
- `DATABASE_WRITE_POOL_MAX` defaults to `25` when `REGION` is `eu`, `10` when `na`.

### 1.2 — Config Namespaces

Each config file uses `registerAs('namespace', () => ({ ... }))`. Each reads from `process.env` and returns a typed plain object. No validation here (Joi handles it). No async. Just transform env strings to proper types (parseInt, split commas, booleans).

`region.config.ts` also computes derived flags:
- `isPrimary: role === 'primary'`
- `isReplica: role === 'replica'`
- `isWriteCapable: role === 'primary'` (NA writes go cross-region to EU DB, but the API instance itself accepts write requests and forwards them via PRISMA_WRITE)

### 1.3 — App Module Imports Config

`ConfigModule.forRoot()` is called with `isGlobal: true`, all namespace loaders, and the validation schema. This is imported first in `app.module.ts` before anything else.

---

## Phase 2: Constants & Types

### 2.1 — Error Codes (`src/common/constants/error-codes.ts`)

An enum of every machine-readable error code the API can return. Codes for foundation + auth:

Generic: `INTERNAL_ERROR`, `NOT_FOUND`, `VALIDATION_FAILED`, `FORBIDDEN`, `UNAUTHORIZED`, `RATE_LIMITED`, `CONFLICT`, `GONE`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `SERVICE_UNAVAILABLE`, `SERVICE_READ_ONLY`, `REQUEST_TIMEOUT`, `IDEMPOTENCY_CONFLICT`.

Auth: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_DISABLED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `TOKEN_REVOKED`, `REFRESH_TOKEN_REUSED`, `MFA_REQUIRED`, `MFA_INVALID`, `MFA_SETUP_REQUIRED`, `SESSION_EXPIRED`, `SESSION_REVOKED`, `PASSWORD_TOO_WEAK`, `PASSWORD_BREACHED`, `EMAIL_ALREADY_EXISTS`, `EMAIL_NOT_VERIFIED`, `VERIFICATION_TOKEN_INVALID`, `VERIFICATION_TOKEN_EXPIRED`, `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED`.

Encryption: `HANDSHAKE_REQUIRED`, `HANDSHAKE_FAILED`, `DECRYPTION_FAILED`, `ENCRYPTED_SESSION_REQUIRED`.

Region: `REGION_UNAVAILABLE`, `WRITE_REGION_UNAVAILABLE`, `REPLICA_LAG_EXCEEDED`.

Future-proofing (define now, use later): `LICENSE_NOT_FOUND`, `LICENSE_EXPIRED`, `LICENSE_ALREADY_ACTIVATED`, `LICENSE_HWID_MISMATCH`, `LICENSE_MAX_ACTIVATIONS`, `LICENSE_SUSPENDED`, `LICENSE_REVOKED`, `MODULE_NOT_FOUND`, `MODULE_VERSION_MISMATCH`, `MODULE_INTEGRITY_FAILED`, `LOADER_SESSION_INVALID`, `LOADER_HEARTBEAT_MISSED`, `PAYMENT_FAILED`, `PAYMENT_DISPUTED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_PAST_DUE`, `TENANT_NOT_FOUND`, `TENANT_SUSPENDED`, `API_KEY_INVALID`, `API_KEY_EXPIRED`, `API_KEY_REVOKED`.

These are defined once, used everywhere. Controllers and services throw exceptions using these codes. The exception filter includes the code in the error response. Clients switch on code, never on message.

### 2.2 — Redis Keys (`src/common/constants/redis-keys.ts`)

Template functions for every Redis key. Every key starts with `as:{region}:`. Functions accept region as the first parameter. This is the ONLY place Redis keys are defined. Services call these functions, never build keys with string concatenation.

Keys for foundation + auth:

Sessions: `as:{region}:sessions:{userId}:{sessionId}` — stores session metadata (device, IP hash, created, last active).
User sessions scan: `as:{region}:sessions:{userId}:*` — pattern for scanning all sessions of a user.
Rate limiting: `as:{region}:rl:{identifier}:{endpoint}` — sliding window counter.
Refresh tokens: `as:{region}:rt:{tokenHash}` — SHA-256 hash of refresh token, value is `{ userId, familyId, createdAt, expiresAt }`.
Refresh token families: `as:{region}:rtf:{familyId}` — tracks token family for rotation/reuse detection.
Encryption session keys: `as:{region}:crypto:{sessionId}` — AES-256-GCM session key derived from ECDH handshake.
Login attempts: `as:{region}:lock:attempts:{identifier}` — counter for progressive delay.
Account lock: `as:{region}:lock:locked:{identifier}` — flag with TTL for temporary lockout.
Email verification: `as:{region}:verify:{token}` — maps to userId, TTL 24 hours.
Password reset: `as:{region}:reset:{token}` — maps to userId, TTL 1 hour.
MFA setup: `as:{region}:mfa:setup:{userId}` — temporary TOTP secret during setup, TTL 10 minutes.
Idempotency: `as:{region}:idem:{userId}:{key}` — cached response for idempotent requests.
Cache: `as:{region}:cache:{module}:{key}` — general purpose cache.
Feature flags: `as:{region}:ff:{flagName}` — PostHog feature flag cache.
Region health: `as:{region}:health:status` — current region status (ok, draining, degraded).
Replica lag: `as:{region}:health:replica-lag` — last measured lag in ms.

Every key function returns a string. Every key that stores data must have a TTL set when written. No orphaned keys.

### 2.3 — Region Constants (`src/common/constants/regions.ts`)

Enum `Region` with values `EU = 'eu'` and `NA = 'na'`.
Enum `RegionRole` with values `PRIMARY = 'primary'` and `REPLICA = 'replica'`.
Interface `RegionConfig` with fields: `region`, `role`, `isWriteCapable`, `isPrimaryRegion`, `hasLocalReadReplica`, `replicaLag: { warningMs, criticalMs }`.
Constant `REGION_CONFIGS` mapping each region to its config.

### 2.4 — Custom Headers (`src/common/constants/headers.ts`)

Constants for every custom header the API uses:

Request headers (client sends):
- `X-Request-Id` — client can optionally send, server generates if missing.
- `X-Idempotency-Key` — for POST/PUT idempotency.
- `X-Client-Version` — client app version string.
- `X-Client-Platform` — `web` or `desktop`.
- `X-Correlation-Id` — forwarded in cross-region calls.

Response headers (server sends):
- `X-Request-Id` — echoed back.
- `X-Region` — which region served the request.
- `X-Read-Only` — `true` if region is in read-only mode.
- `X-RateLimit-Remaining` — remaining requests in window.
- `X-RateLimit-Reset` — seconds until window resets.

### 2.5 — Permissions (`src/common/constants/permissions.ts`)

Every authorization decision in the API is made against a permission code. Roles are bundles of permissions (see 2.6) — endpoint guards never check role names.

Permission codes follow the format `{resource}:{action}:{scope}` where:
- `resource` — the domain object (`user`, `session`, `mfa`, `audit`, `tenant`, etc.).
- `action` — what the caller is trying to do (`read`, `write`, `create`, `delete`, `list`, `lock`, `unlock`, `restore`, `manage`).
- `scope` — the breadth of the action: `self` (only their own record), `tenant` (any record within the actor's tenant), `any` (platform-wide, no tenant restriction). Scope is omitted when it's irrelevant (e.g. `user:create` has no self/tenant/any distinction at the permission level).

The file exports a `Permission` object where every permission is a typed constant:

```typescript
export const Permission = {
  USER_READ_SELF: 'user:read:self',
  USER_READ_TENANT: 'user:read:tenant',
  USER_READ_ANY: 'user:read:any',
  USER_WRITE_SELF: 'user:write:self',
  USER_WRITE_TENANT: 'user:write:tenant',
  USER_WRITE_ANY: 'user:write:any',
  USER_CREATE: 'user:create',
  USER_DELETE: 'user:delete',
  USER_RESTORE: 'user:restore',
  USER_LOCK_TENANT: 'user:lock:tenant',
  USER_LOCK_ANY: 'user:lock:any',
  USER_LIST_TENANT: 'user:list:tenant',
  USER_LIST_ANY: 'user:list:any',
  SESSION_READ_SELF: 'session:read:self',
  SESSION_REVOKE_SELF: 'session:revoke:self',
  SESSION_REVOKE_ANY: 'session:revoke:any',
  MFA_MANAGE_SELF: 'mfa:manage:self',
  AUDIT_READ_TENANT: 'audit:read:tenant',
  AUDIT_READ_ANY: 'audit:read:any',
} as const;

export type PermissionCode = typeof Permission[keyof typeof Permission];
```

The `as const` + derived `PermissionCode` union gives compile-time safety: typos in `@RequirePermission('user:read:slf')` fail at build time. Future modules append their permissions to this file and nothing else.

Scope semantics enforced at the guard + service layer:
- `self` — guard only allows the request when the acting user's ID equals the target (or when the endpoint reads/writes the caller's own record).
- `tenant` — guard allows the request; service layer filters queries by `actor.tenantId`. The permission grants the *capability*; tenant isolation is enforced on the data.
- `any` — guard allows the request; no tenant filter applied.

### 2.6 — Role-Permission Map (`src/common/constants/role-permissions.ts`)

Roles are *named bundles* of permissions. Users are assigned roles (stored on `User.roles`). At access-token issuance, TokenService flattens the user's role list into the effective permission set and stuffs it into the JWT.

```typescript
import { Permission, PermissionCode } from './permissions';

export const Role = {
  USER: 'user',
  TENANT_ADMIN: 'tenant-admin',
  ADMIN: 'admin',
} as const;

export type RoleCode = typeof Role[keyof typeof Role];

export const ROLE_PERMISSIONS: Record<RoleCode, readonly PermissionCode[]> = {
  [Role.USER]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.MFA_MANAGE_SELF,
  ],
  [Role.TENANT_ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.USER_READ_TENANT,
    Permission.USER_WRITE_TENANT,
    Permission.USER_LIST_TENANT,
    Permission.USER_LOCK_TENANT,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.MFA_MANAGE_SELF,
    Permission.AUDIT_READ_TENANT,
  ],
  [Role.ADMIN]: [
    Permission.USER_READ_SELF,
    Permission.USER_WRITE_SELF,
    Permission.USER_READ_ANY,
    Permission.USER_WRITE_ANY,
    Permission.USER_CREATE,
    Permission.USER_DELETE,
    Permission.USER_RESTORE,
    Permission.USER_LIST_ANY,
    Permission.USER_LOCK_ANY,
    Permission.SESSION_READ_SELF,
    Permission.SESSION_REVOKE_SELF,
    Permission.SESSION_REVOKE_ANY,
    Permission.MFA_MANAGE_SELF,
    Permission.AUDIT_READ_ANY,
  ],
} as const;

export function flattenRoles(roles: readonly string[]): PermissionCode[] {
  const set = new Set<PermissionCode>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as RoleCode];
    if (!perms) continue;
    for (const p of perms) set.add(p);
  }
  return [...set];
}
```

`flattenRoles` is called by TokenService when generating an access token. Unknown role names are silently ignored (forward-compatible — a client on an older schema does not crash the server).

Rules:
- Every endpoint that requires authorization declares a `@RequirePermission(Permission.X)` (never `@Roles('admin')`).
- This file is the ONLY place role → permission mapping lives.
- Adding a new permission is a two-step change: define the constant in 2.5, add it to the relevant role bundle(s) here.
- Changing a role's permission set is a code deploy (by design — permission changes are reviewed in PR).
- The eventual migration to DB-backed permissions swaps this constant map for a Prisma query at token issuance. Nothing else changes.

### 2.7 — Branded Types (`src/common/types/branded-types.ts`)

TypeScript branded types for type safety on IDs. Prevents passing a UserId where a SessionId is expected:

```typescript
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type SessionId = Brand<string, 'SessionId'>;
type TenantId = Brand<string, 'TenantId'>;
type RefreshTokenHash = Brand<string, 'RefreshTokenHash'>;
type RequestId = Brand<string, 'RequestId'>;
```

Helper functions to create branded values from raw strings.

### 2.8 — Interfaces

`request-with-user.interface.ts` — extends Express `Request` with `user` property containing the decoded JWT payload (userId, email, roles, permissions, tenantId).

`request-with-region.interface.ts` — extends Request with `region` property containing the current region string and `regionConfig` containing the full region config.

`paginated-result.interface.ts` — generic `PaginatedResult<T>` with `data: T[]`, `meta: { cursor, hasMore, count }`.

`service-response.interface.ts` — not needed (services return data or throw, response wrapping is handled by the transform interceptor).

### 2.9 — Utility Functions

`hash.util.ts`:
- `constantTimeCompare(a: string, b: string): boolean` — wraps `crypto.timingSafeEqual`. Used for comparing tokens, hashes, HMACs. Prevents timing attacks.
- `sha256(input: string): string` — returns hex-encoded SHA-256 hash. Used for hashing refresh tokens before storage.
- `generateSecureToken(bytes: number): string` — wraps `crypto.randomBytes`. Returns hex string. Used for refresh tokens, verification tokens, reset tokens.

`crypto.util.ts`:
- `aesEncrypt(plaintext: Buffer, key: Buffer, aad?: Buffer): { nonce: Buffer, ciphertext: Buffer, tag: Buffer }` — AES-256-GCM encryption. Generates random 12-byte nonce. Returns nonce + ciphertext + auth tag.
- `aesDecrypt(nonce: Buffer, ciphertext: Buffer, tag: Buffer, key: Buffer, aad?: Buffer): Buffer` — AES-256-GCM decryption. Throws if tag verification fails.
- `deriveKey(sharedSecret: Buffer, salt: Buffer, info: string): Buffer` — HKDF-SHA256 key derivation. Returns 32-byte key.

`time.util.ts`:
- `nowUtc(): Date` — current time in UTC.
- `isoNow(): string` — current time as ISO 8601 string.
- `parseDuration(duration: string): number` — parses strings like `15m`, `30d`, `1h` to milliseconds.
- `isExpired(expiresAt: Date): boolean` — checks if a date is in the past.

`redact.util.ts`:
- `redactEmail(email: string): string` — `user@example.com` becomes `u***@e***.com`.
- `redactIp(ip: string): string` — returns SHA-256 hash of IP, truncated to 8 chars: `hash:a1b2c3d4`.
- `redactToken(token: string): string` — always returns `[REDACTED]`.

`id.util.ts`:
- `generateId(): string` — generates UUID v7 (time-sortable). Uses `crypto.randomUUID()` as fallback if v7 is not available natively, but prefer a UUID v7 implementation for sortable IDs in database primary keys.

---

## Phase 3: Database Module

### 3.1 — Prisma Schema (`src/prisma/schema.prisma`)

Datasource: `postgresql`. Generator: `prisma-client-js`.

Models needed for foundation + user + auth:

**User**:
- `id` — UUID, default `uuid()`, primary key.
- `email` — String, unique, max 255.
- `emailVerified` — Boolean, default false.
- `passwordHash` — String, max 255.
- `firstName` — String, nullable, max 100.
- `lastName` — String, nullable, max 100.
- `roles` — String array, default `['user']`. Values: `user`, `admin`, `tenant-admin`.
- `isActive` — Boolean, default true.
- `isLocked` — Boolean, default false.
- `lockReason` — String, nullable.
- `lockedUntil` — DateTime, nullable.
- `failedLoginAttempts` — Int, default 0.
- `lastLoginAt` — DateTime, nullable.
- `lastLoginIp` — String, nullable (stored as hash).
- `passwordChangedAt` — DateTime, nullable.
- `mfaEnabled` — Boolean, default false.
- `mfaSecret` — String, nullable (encrypted at rest).
- `mfaRecoveryCodes` — String array, default empty (each code hashed).
- `tenantId` — UUID, nullable, foreign key to Tenant (nullable because platform admins have no tenant).
- `createdAt` — DateTime, default now.
- `updatedAt` — DateTime, auto-updated.
- `deletedAt` — DateTime, nullable (soft delete).

Indexes on User:
- Unique on `email`.
- Index on `tenantId`.
- Index on `isActive`.
- Index on `createdAt`.

**RefreshTokenFamily**:
- `id` — UUID, primary key.
- `userId` — UUID, foreign key to User.
- `currentTokenHash` — String. SHA-256 hash of the currently valid refresh token.
- `region` — String. Region where this family was created.
- `deviceInfo` — String, nullable. User agent or device description.
- `ipHash` — String, nullable. Hashed IP at creation.
- `isRevoked` — Boolean, default false.
- `revokedReason` — String, nullable.
- `createdAt` — DateTime.
- `expiresAt` — DateTime.
- `lastUsedAt` — DateTime.

Indexes on RefreshTokenFamily:
- Index on `userId`.
- Index on `currentTokenHash`.
- Index on `isRevoked`.
- Index on `expiresAt`.

**AuditLog**:
- `id` — UUID, primary key.
- `userId` — UUID, nullable (null for unauthenticated actions like failed login).
- `action` — String. Machine-readable action name: `auth.login`, `auth.login.failed`, `auth.logout`, `auth.register`, `auth.password.change`, `auth.password.reset`, `auth.mfa.enable`, `auth.mfa.disable`, `auth.session.revoke`, `auth.token.refresh`, `auth.token.reuse_detected`.
- `resource` — String, nullable. What was acted on (e.g. `user:{id}`).
- `detail` — JSON, nullable. Additional context (e.g. `{ reason: "invalid_password" }`).
- `ipHash` — String. Hashed IP.
- `userAgent` — String, nullable.
- `region` — String. Which region processed this.
- `requestId` — String. Links to the request that triggered this.
- `previousHash` — String. SHA-256 hash of the previous audit log entry (hash chain for integrity).
- `currentHash` — String. SHA-256 hash of this entry (computed from all fields + previousHash).
- `createdAt` — DateTime.

Indexes on AuditLog:
- Index on `userId`.
- Index on `action`.
- Index on `createdAt`.
- Index on `requestId`.

**Tenant** (skeleton for multi-tenancy — needed because User references it):
- `id` — UUID, primary key.
- `name` — String, max 255.
- `slug` — String, unique, max 100.
- `isActive` — Boolean, default true.
- `createdAt` — DateTime.
- `updatedAt` — DateTime.
- `deletedAt` — DateTime, nullable.

Index on Tenant:
- Unique on `slug`.

Run `npx prisma generate` after defining the schema.

### 3.2 — Database Module (`src/database/database.module.ts`)

This module provides two Prisma client instances:

`PRISMA_WRITE` — connects to `DATABASE_WRITE_URL`. This always points to KV2-EU (the PostgreSQL primary). In EU, this is a local connection (~1-5ms). In NA, this crosses the Atlantic (~100-150ms). Connection pool sized by `DATABASE_WRITE_POOL_MAX`.

`PRISMA_READ` — connects to `DATABASE_READ_URL`. In EU, this points to the same KV2-EU primary (or a local replica if added later). In NA, this points to the local read replica on the same KVM4 (~1ms). Connection pool sized by `DATABASE_READ_POOL_MAX`.

Both clients:
- Enable query logging in development (log queries over 100ms in production).
- Set statement timeout via `DATABASE_STATEMENT_TIMEOUT`.
- Enable SSL when `DATABASE_SSL` is true.
- Implement `OnModuleInit` to call `$connect()`.
- Implement `OnModuleDestroy` to call `$disconnect()`.

The module exports both `PRISMA_WRITE` and `PRISMA_READ` as injection tokens. Services inject them with `@Inject('PRISMA_WRITE')` and `@Inject('PRISMA_READ')`.

### 3.3 — Prisma Health Indicator (`src/database/prisma.health.ts`)

Custom `HealthIndicator` for `@nestjs/terminus`. Checks both read and write connections by running `SELECT 1`. Reports latency for each. Marks write as degraded (not failed) if latency exceeds 500ms (expected for NA cross-Atlantic).

### 3.4 — Migrations

After defining the schema, generate the initial migration:
```bash
npx prisma migrate dev --name init
```

This creates the migration SQL. Review it manually. Verify all indexes, constraints, and defaults are correct. Commit the migration file.

### 3.5 — Seed Script (`src/database/seeds/`)

A seed script that creates:
- One admin user with email `admin@allservices.cc`, a known password (for development only), role `admin`, email verified.
- One test tenant with name `AllServices`, slug `allservices`.

Seed script only runs in development. It checks if data already exists before inserting (idempotent).

---

## Phase 4: Redis Module

### 4.1 — Redis Module (`src/redis/redis.module.ts`)

Creates an `ioredis` client connected to `REDIS_URL`. Configuration:
- TLS if `REDIS_TLS` is true.
- Key prefix from `REDIS_KEY_PREFIX` (but the RedisKeys helper functions already include the full prefix, so ioredis prefix should be empty — avoid double-prefixing).
- `maxRetriesPerRequest` from `REDIS_MAX_RETRIES`.
- `retryStrategy` with exponential backoff: `Math.min(retries * 50, 2000)`.
- `enableReadyCheck: true`.
- `lazyConnect: false` — connect immediately on module init.

### 4.2 — Redis Service (`src/redis/redis.service.ts`)

A thin wrapper around ioredis that:
- Injects the ioredis client.
- Provides typed methods: `get(key)`, `set(key, value, ttlSeconds)`, `del(key)`, `exists(key)`, `incr(key)`, `expire(key, ttlSeconds)`, `scan(pattern)`, `ttl(key)`.
- Every `set` call REQUIRES a TTL. There is no set-without-TTL method. This prevents orphaned keys.
- Provides `getJson<T>(key)` and `setJson<T>(key, value, ttlSeconds)` that handle JSON serialization/deserialization.
- Implements `OnModuleDestroy` to call `client.quit()`.

### 4.3 — Redis Health Indicator (`src/redis/redis.health.ts`)

Custom `HealthIndicator` that runs `PING` and reports latency.

---

## Phase 5: Observability Module

### 5.1 — Sentry Service (`src/observability/sentry.service.ts`)

Initialises Sentry SDK with:
- DSN from config.
- Environment from config.
- Traces sample rate from config.
- Release tied to git commit SHA (via env var `SENTRY_RELEASE` or `GIT_SHA`).
- Tags: `region` and `regionRole` set on every event.
- Before-send hook: strip PII (email, IP) from event data. Only send hashed identifiers.
- Integrations: HTTP, Express, Prisma (if available).
- Profiling enabled via `@sentry/profiling-node`.

Implements `OnModuleInit` to call `Sentry.init()`.
Implements `OnModuleDestroy` to call `Sentry.close(2000)` (flush with 2s timeout).

Exports helper methods:
- `captureException(error, context?)` — sends error to Sentry with request ID, user ID, region.
- `captureMessage(message, level, context?)` — sends message.
- `setUser(userId)` — sets user context for the current scope.
- `addBreadcrumb(breadcrumb)` — adds breadcrumb to current scope.

### 5.2 — PostHog Service (`src/observability/posthog.service.ts`)

Initialises PostHog server-side SDK with:
- API key from config.
- Host from config (`https://eu.posthog.com` for GDPR).
- Flush interval: 30 seconds.
- Batch size: 20 events.

Exports methods:
- `capture(userId, event, properties?)` — tracks an event.
- `identify(userId, properties)` — identifies a user with properties.
- `isFeatureEnabled(flagName, userId)` — checks a feature flag (with Redis cache, TTL 5 minutes).
- `shutdown()` — flushes pending events. Called on module destroy.

Events to track from auth module:
- `user_registered` — with `{ region }`.
- `user_logged_in` — with `{ region, platform }`.
- `user_logged_out` — with `{ region }`.
- `password_changed` — with `{ region }`.
- `password_reset_requested` — with `{ region }`.
- `mfa_enabled` — with `{ region }`.
- `mfa_disabled` — with `{ region }`.
- `login_failed` — with `{ region, reason }`.
- `account_locked` — with `{ region, reason }`.
- `token_reuse_detected` — with `{ region }`.

### 5.3 — Metrics Service (`src/observability/metrics.service.ts`)

Uses `prom-client` to expose Prometheus metrics at `/metrics` (behind an internal guard — not public).

Default metrics enabled (CPU, memory, event loop lag, GC).

Custom metrics:
- `http_request_duration_seconds` — histogram, labels: `method`, `path`, `status_code`, `region`.
- `http_requests_total` — counter, labels: `method`, `path`, `status_code`, `region`.
- `active_connections` — gauge, label: `region`.
- `db_query_duration_seconds` — histogram, labels: `operation` (read/write), `region`.
- `redis_operation_duration_seconds` — histogram, labels: `operation`, `region`.
- `auth_login_total` — counter, labels: `status` (success/failed), `region`.
- `auth_register_total` — counter, labels: `region`.
- `active_sessions` — gauge, labels: `region`.

The metrics endpoint is a separate controller that:
- Returns `text/plain` content type (Prometheus format).
- Is decorated with `@Public()` (no JWT required) but protected by IP allowlist or internal secret header.
- Is NOT under `/v1/` prefix. It lives at `/metrics`.

### 5.4 — Pino Logger

Configured via `nestjs-pino` in `app.module.ts`:

- `pinoHttp` configuration:
    - Level from `LOG_LEVEL` config.
    - In development: use `pino-pretty` transport for readable output.
    - In production: raw JSON output (no transport).
    - `genReqId`: use `X-Request-Id` header if present, otherwise generate UUID v7.
    - `customProps`: add `region` and `regionRole` to every log line.
    - `redact`: paths to redact in logs: `req.headers.authorization`, `req.body.password`, `req.body.currentPassword`, `req.body.newPassword`, `req.body.token`, `req.body.mfaCode`, `req.body.recoveryCodes`.
    - `serializers`: custom serializers for `req` (only log method, url, query, remoteAddress hashed) and `res` (only log statusCode).
    - `autoLogging`: true (log every request/response automatically).
    - `customLogLevel`: map status codes to log levels: 2xx → info, 3xx → info, 4xx → warn, 5xx → error.

### 5.5 — Observability Module (`src/observability/observability.module.ts`)

Global module that imports and exports Sentry, PostHog, and Metrics services. Imported once in `app.module.ts`.

---

## Phase 6: Common Infrastructure

### 6.1 — Middleware

**Request ID Middleware (`request-id.middleware.ts`)**:
- Reads `X-Request-Id` from incoming request headers.
- If present and valid (UUID format), use it.
- If missing or invalid, generate UUID v7.
- Attach to `req.requestId`.
- Set `X-Request-Id` response header.
- This middleware runs on ALL routes.

**Correlation ID Middleware (`correlation-id.middleware.ts`)**:
- Reads `X-Correlation-Id` from incoming request headers.
- If present, attach to `req.correlationId`.
- If missing, set `req.correlationId = req.requestId`.
- Used when making cross-region API calls — forward the correlation ID.

**Real IP Middleware (`real-ip.middleware.ts`)**:
- Reads the real client IP from Cloudflare's `CF-Connecting-IP` header.
- Falls back to `X-Forwarded-For` (first IP in the chain).
- Falls back to `req.ip`.
- Hashes the IP using SHA-256 (truncated to 16 chars) and stores as `req.ipHash`.
- Stores the raw IP as `req.realIp` (used for rate limiting, but NEVER logged raw).

### 6.2 — Guards

**JWT Auth Guard (`jwt-auth.guard.ts`)**:
- Extends `AuthGuard('jwt')` from Passport.
- Checks for `@Public()` decorator via Reflector. If present, skip auth.
- If no token provided, throw `UnauthorizedException` with code `UNAUTHORIZED`.
- If token invalid/expired, throw `UnauthorizedException` with appropriate code (`TOKEN_EXPIRED` or `TOKEN_INVALID`).
- Registered as `APP_GUARD` (global — every route requires auth by default).

**Permissions Guard (`permissions.guard.ts`)** — primary authorization guard:
- Reads `@RequirePermission(...perms)` decorator metadata via Reflector.
- If no permissions required on the route, allow (authentication was already handled by JwtAuthGuard).
- If permissions required, check `req.user.permissions` array (from JWT) contains ALL required permissions. Default behaviour is AND — every listed permission must be present. For OR semantics use `@RequireAnyPermission(...perms)` (separate decorator, same guard logic with `some()` instead of `every()`).
- If the check fails, throw `ForbiddenException` with code `FORBIDDEN` and detail `{ requiredPermissions, actorPermissions }` (logged server-side only — the detail is stripped from the client response).
- `self`-scoped permissions require an additional identity check: the guard compares `req.params.id` (or `req.body.userId`, configurable via the decorator) to `req.user.id`. If the endpoint is `self`-scoped but the IDs don't match, the guard returns false (forcing a `*:*:tenant` or `*:*:any` permission instead). This lets one endpoint satisfy both "edit self" and "admin edit anyone" via a single `@RequirePermission(Permission.USER_WRITE_SELF, Permission.USER_WRITE_ANY)` declaration with OR semantics.
- Registered as `APP_GUARD` (global). Every authenticated route passes through it. Routes without `@RequirePermission` are allowed by default (auth alone is sufficient).

**Roles Guard (`roles.guard.ts`)** — legacy/admin-tooling fallback:
- Reads `@Roles()` decorator metadata via Reflector.
- If roles required, check `req.user.roles` array includes at least one required role.
- Kept for thin admin-tooling use cases where role-name checks are semantically clearer than permission checks (e.g. role-assignment endpoints that must verify the caller is *literally* an admin, not just "has user:write:any"). New endpoints should prefer `@RequirePermission`.
- Registered as `APP_GUARD` (global), runs after PermissionsGuard.

**Throttler Behind Proxy Guard (`throttler-behind-proxy.guard.ts`)**:
- Extends NestJS `ThrottlerGuard`.
- Overrides `getTracker()` to use `req.realIp` (from Real IP middleware) instead of `req.ip`.
- This is critical: without this, all requests behind Cloudflare share one rate limit.

**Write Region Guard (`write-region.guard.ts`)**:
- Checks if the current region can handle write operations.
- Reads `@WriteOperation()` decorator metadata. If not present, allow.
- Checks if the write database is reachable (via a health flag maintained by the region service).
- If not reachable, throw `ServiceUnavailableException` with code `SERVICE_READ_ONLY` and `retryAfter: 30`.
- Not registered globally — only applied to write endpoints via decorator.

### 6.3 — Interceptors

**Region Interceptor (`region.interceptor.ts`)**:
- Runs on every request.
- Reads region from config and attaches to `req.region` and `req.regionConfig`.
- Sets `X-Region` response header.
- If region is in read-only mode, sets `X-Read-Only: true` header.

**Logging Interceptor (`logging.interceptor.ts`)**:
- Wraps the route handler execution.
- Records start time.
- On completion: logs method, path, status code, duration, user ID (if authenticated), region.
- On error: logs the same plus error details.
- Feeds duration data to Prometheus histogram.
- Note: Pino's `autoLogging` handles basic request logging. This interceptor adds business context (userId, tenantId) that Pino doesn't have.

**Timeout Interceptor (`timeout.interceptor.ts`)**:
- Uses RxJS `timeout` operator.
- Default timeout: 30 seconds.
- Catches `TimeoutError` and throws `RequestTimeoutException` with code `REQUEST_TIMEOUT`.
- Reads `@Timeout(ms)` decorator for per-route overrides.

**Transform Interceptor (`transform.interceptor.ts`)**:
- Wraps every successful response in the standard envelope:
  ```
  {
    data: <response>,
    meta: {
      requestId: req.requestId,
      timestamp: isoNow(),
      version: '1',
      region: req.region
    }
  }
  ```
- For paginated responses (when response has `data` and `meta.pagination`), merges pagination into meta.
- Does NOT wrap responses that are already wrapped (check for `data` key at top level).

**Encryption Interceptor (`encryption.interceptor.ts`)**:
- Checks if the request has an active encryption session (session key in Redis).
- If yes: decrypt incoming request body (expects `{ nonce, ciphertext, tag }` format). Replace `req.body` with decrypted JSON. Encrypt outgoing response body before sending.
- If no: pass through unchanged (plain JSON for web clients).
- Routes decorated with `@EncryptedOnly()` reject unencrypted sessions with code `ENCRYPTED_SESSION_REQUIRED`.
- The handshake endpoint is excluded from this interceptor.

**Idempotency Interceptor (`idempotency.interceptor.ts`)**:
- Only activates on POST and PUT requests.
- Reads `X-Idempotency-Key` header.
- If present: check Redis for cached response with key `as:{region}:idem:{userId}:{idempotencyKey}`.
    - If found: return cached response immediately (do not execute handler).
    - If not found: execute handler, cache the response with TTL 24 hours, return response.
- If header not present on a route decorated with `@Idempotent()`: throw `BadRequestException` with message "X-Idempotency-Key header required".
- If header not present on a non-decorated route: pass through (idempotency optional).

**Serializer Interceptor (`serializer.interceptor.ts`)**:
- Uses `class-transformer`'s `ClassSerializerInterceptor` to strip fields marked with `@Exclude()`.
- Registered globally.
- Ensures internal fields (passwordHash, mfaSecret, etc.) never appear in responses even if accidentally returned.

### 6.4 — Filters

**All Exceptions Filter (`all-exceptions.filter.ts`)**:
- Catches every exception (both `HttpException` and unknown errors).
- For `HttpException`: extract status, message, and code. Return structured error response.
- For unknown errors: log full error with stack trace to Pino AND Sentry. Return generic 500 response with code `INTERNAL_ERROR` and message "An unexpected error occurred."
- NEVER include stack traces, SQL errors, file paths, or internal details in the response.
- ALWAYS include `requestId` and `region` in the error response.
- ALWAYS include `timestamp` as ISO 8601 UTC.
- For validation errors (status 422): include `details` array with field-level errors.

Error response shape:
```
{
  error: {
    code: string,
    message: string,
    statusCode: number,
    requestId: string,
    timestamp: string,
    region: string,
    details?: Array<{ field: string, message: string, code: string }>,
    retryAfter?: number
  }
}
```

### 6.5 — Pipes

**Parse UUID Pipe (`parse-uuid.pipe.ts`)**:
- Validates that a string parameter is a valid UUID v4 or v7.
- Throws `BadRequestException` with code `VALIDATION_FAILED` if invalid.
- Used on all `:id` route parameters.

**Sanitize Pipe (`sanitize.pipe.ts`)**:
- Strips all HTML tags from string inputs using `sanitize-html` with `allowedTags: []`.
- Applied selectively to DTOs that accept user-generated text content.
- Does NOT apply to password fields (passwords can contain any characters).

### 6.6 — Decorators

**`@Public()`** — sets metadata `isPublic: true`. JWT guard checks this and skips auth.

**`@RequirePermission(...perms: PermissionCode[])`** — primary authorization decorator. Sets metadata `requiredPermissions: PermissionCode[]` with mode `all`. PermissionsGuard checks that `req.user.permissions` contains every listed permission. Parameter type is the `PermissionCode` union from 2.5 — typos fail at compile time.

**`@RequireAnyPermission(...perms: PermissionCode[])`** — same as above but with mode `any`. Guard passes if `req.user.permissions` contains at least one of the listed permissions. Used for "self OR admin" patterns: `@RequireAnyPermission(Permission.USER_WRITE_SELF, Permission.USER_WRITE_ANY)`.

**`@SelfParam(paramName: string = 'id')`** — marker decorator used alongside `self`-scoped permissions. Tells PermissionsGuard which route parameter holds the target user's ID (default `id`, override for routes like `:userId`). Without this decorator, `self`-scoped permissions check `req.params.id` by convention.

**`@Roles(...roles: RoleCode[])`** — legacy role check. Sets metadata `roles: RoleCode[]`. RolesGuard checks this. Only used on endpoints that semantically target role names (e.g. "list all admins"). Prefer `@RequirePermission` for new routes.

**`@CurrentPermissions()`** — parameter decorator that extracts `req.user.permissions` from the request. Returns `PermissionCode[]`. Used inside services that need to apply per-permission filtering in business logic (e.g. return a richer response if `AUDIT_READ_ANY` is present).

**`@CurrentUser()`** — parameter decorator that extracts `req.user` from the request. Returns the full decoded JWT payload.

**`@CurrentRegion()`** — parameter decorator that extracts `req.region` string.

**`@RateLimit(limit, ttlSeconds)`** — sets metadata for per-route rate limit override. The throttler guard reads this.

**`@Idempotent()`** — marks a route as requiring the `X-Idempotency-Key` header.

**`@EncryptedOnly()`** — marks a route as requiring an encrypted session (desktop clients only).

**`@WriteOperation()`** — marks a route as a write operation. The write region guard checks this and rejects if region is read-only.

**`@ReadOnlySafe()`** — marks a route as safe to serve from a read-only region. Used for documentation purposes and for Cloudflare routing decisions.

### 6.7 — DTOs

**Pagination DTO (`pagination.dto.ts`)**:
- `cursor` — optional string, base64-encoded cursor from previous response.
- `limit` — optional number, min 1, max 100, default 25.
- Validated with class-validator decorators.

**API Response DTO (`api-response.dto.ts`)**:
- Generic class `ApiResponse<T>` with `data: T` and `meta: ApiMeta`.
- `ApiMeta` with `requestId`, `timestamp`, `version`, `region`, optional `pagination`.
- Used for Swagger documentation (decorating controller responses).

---

## Phase 7: Region Module

### 7.1 — Region Service (`src/region/region.service.ts`)

Reads region config at startup. Provides:
- `getRegion(): Region` — current region.
- `getRole(): RegionRole` — current role.
- `isPrimary(): boolean`.
- `isReplica(): boolean`.
- `isWriteAvailable(): boolean` — checks if write DB is reachable. Updated by health checks every 10 seconds.
- `getReplicaLag(): number | null` — last known replica lag in ms (only meaningful for NA).

Periodically (every 10 seconds) checks write DB connectivity by running `SELECT 1` on PRISMA_WRITE. Updates an internal flag. If the check fails 3 times in a row, marks writes as unavailable.

For replica regions (NA): periodically queries `pg_stat_replication` on the read replica to measure lag. Stores in Redis for the health endpoint.

### 7.2 — Region Health Indicator (`src/region/region.health.ts`)

Custom health indicator for `@nestjs/terminus`:
- Checks write DB connectivity and latency.
- Checks replica lag (if applicable).
- Reports `writable: true/false`.
- If replica lag exceeds critical threshold (5000ms), reports warning.

---

## Phase 8: Crypto Module

The crypto module serves two independent purposes:
1. **At-rest encryption** of sensitive fields (MFA secrets, future API keys, future PII) using a master key loaded from config.
2. **In-transit encryption** of desktop-client traffic via an ECDH handshake that produces per-session AES-256-GCM keys held in Redis.

Both are built on the same primitives (`aesEncrypt`/`aesDecrypt`/`deriveKey` from `crypto.util.ts`). The module never generates a key without a source — keys come from config (master key) or from an ECDH exchange (session keys).

### 8.1 — Master Key Loading (`src/crypto/master-key.provider.ts`)

Loads the at-rest master key at module-init time. Single source of truth for all server-side encryption.

Behaviour:
- Reads `CRYPTO_MASTER_KEY` from config. The env var holds a hex-encoded 32-byte key (64 hex chars).
- Validates length on startup — throws if not exactly 32 bytes; the app refuses to boot with a bad key.
- Derives two purpose-specific sub-keys via HKDF-SHA256 with different `info` contexts so the same master can never be mis-used across contexts:
    - `restKey = deriveKey(master, salt="allservices-rest-v1", info="at-rest-encryption")` — used by CryptoService for field encryption.
    - `tokenKey = deriveKey(master, salt="allservices-tokens-v1", info="token-hmac")` — reserved for future HMAC of server-issued opaque tokens.
- Exposes the derived keys via injection tokens `CRYPTO_REST_KEY` and `CRYPTO_TOKEN_KEY`. The raw master key is never exposed outside the provider.
- Logs `crypto.master_key.loaded` with the key fingerprint (`sha256(master).slice(0, 8)`) on startup. The fingerprint allows key-rotation audits without leaking the key itself.

Key rotation strategy:
- Ciphertext is prefixed with a key version tag (`v1:`). See 8.2.
- To rotate: set `CRYPTO_MASTER_KEY_V2` alongside the existing `CRYPTO_MASTER_KEY`, restart with `CRYPTO_ACTIVE_VERSION=v2`. The provider loads both. Decryption uses the version tag on the ciphertext to pick the right key. Encryption always uses the active version.
- Rotation runs as a background job (future module) that re-encrypts `v1:` ciphertexts to `v2:`. Not part of Phase 8 scope — just the hooks.

### 8.2 — Crypto Service (`src/crypto/crypto.service.ts`)

At-rest field encryption. Stateless given injected keys. Used by MFA service, future API-key module, and any module that stores secrets in the DB.

Ciphertext wire format (stored as a single string in a DB column):
```
v{version}:{nonce_hex}:{ciphertext_hex}:{tag_hex}
```
- Example: `v1:a3f2e1...:9c0d...:8a7b...`
- Splitting on `:` yields exactly 4 parts — any other count is invalid ciphertext.
- Version tag allows per-field key rotation and detection of tampering/truncation.

Methods:
- `encryptAtRest(plaintext: string, aad?: string): string` — encrypts a UTF-8 string using the active `restKey`. Generates a fresh 12-byte nonce via `crypto.randomBytes`. Uses `aad` as the additional-authenticated-data if provided (typical: `userId` for MFA secrets, so a ciphertext swapped between users fails tag verification). Returns the wire-format string.
- `decryptAtRest(ciphertext: string, aad?: string): string` — parses the wire format, picks the key by version tag, runs `aesDecrypt`. Throws `DecryptionFailedError` with code `DECRYPTION_FAILED` if the tag fails, if the version is unknown, or if the format is malformed. Never returns a partial/mangled plaintext.
- `rotateField(oldCiphertext: string, aad?: string): string` — convenience that decrypts with the old version, encrypts with the active version. Used by the future rotation job.

Never persists anything itself. Never logs plaintext or key material. Any error logs include only the version tag and length of the offending ciphertext.

### 8.3 — Key Exchange Service (`src/crypto/key-exchange.service.ts`)

Handles the ECDH handshake for desktop clients that use end-to-end encrypted sessions (desktop only — web clients use TLS + HttpOnly cookies and do not need this).

Design decisions:
- Curve: **X25519**. Modern, constant-time by construction, 32-byte keys, no curve-parameter confusion.
- KDF: HKDF-SHA256 with salt = concatenation of both public keys (`clientPub || serverPub`) and `info = "allservices-session-v1"`. Binds the derived key to the specific exchange — replay of the same ECDH output across sessions is impossible.
- Fresh keypair per handshake. Server's ECDH private key lives only in process memory until the derived session key is stored, then is zeroed.
- Session ID: 128-bit value from `crypto.randomBytes(16)` hex-encoded (32 chars). Returned to the client alongside the server public key.

Methods:
- `initiateHandshake(clientPublicKey: Buffer): Promise<{ serverPublicKey: Buffer; sessionId: string; expiresAt: Date }>` —
    1. Validates `clientPublicKey.length === 32` (X25519). Rejects with `HANDSHAKE_FAILED` otherwise.
    2. Generates server keypair with `crypto.generateKeyPairSync('x25519')`.
    3. Computes shared secret with `crypto.diffieHellman({ privateKey, publicKey: clientPublicKey })`.
    4. Derives 32-byte AES key via `deriveKey(sharedSecret, salt = clientPub || serverPub, info = "allservices-session-v1")`.
    5. Calls `KeyStoreService.store(sessionId, sessionKey, ttlSeconds = CRYPTO_SESSION_TTL)`.
    6. Zeros the server private key buffer.
    7. Returns server public key (as Buffer), session ID, and `expiresAt` for client bookkeeping.
- `validateSessionKey(sessionId: string): Promise<Buffer>` — fetches the session key from KeyStoreService, throws `ENCRYPTED_SESSION_REQUIRED` if not found or expired.
- Exposes no other surface. ECDH handshakes are initiated only through the public handshake endpoint (registered in a future `HandshakeController` under the crypto module).

### 8.4 — Key Store Service (`src/crypto/key-store.service.ts`)

Stores and retrieves session encryption keys in Redis. Thin wrapper over RedisService with binary-safe value handling.

Methods:
- `store(sessionId: string, key: Buffer, ttlSeconds: number): Promise<void>` — stores at `as:{region}:crypto:{sessionId}` as base64-encoded string. TTL is mandatory (RedisService enforces this). Throws if `key.length !== 32`.
- `retrieve(sessionId: string): Promise<Buffer | null>` — reads the key, base64-decodes, returns Buffer or null if missing/expired.
- `revoke(sessionId: string): Promise<void>` — deletes the key. Called on logout, session revocation, or key-rotation.
- `extend(sessionId: string, ttlSeconds: number): Promise<boolean>` — resets the TTL. Called on each authenticated request from a desktop client to keep the session alive.

Redis keys:
- Pattern: `as:{region}:crypto:{sessionId}`.
- Region-local (EU sessions stored on EU Redis, NA sessions on NA Redis). No cross-region replication of session keys — if the client roams regions, it performs a new handshake.

### 8.5 — Encrypted Decorator & Interceptor Integration

The encryption interceptor (`src/common/interceptors/encryption.interceptor.ts`, already in Phase 6) depends on CryptoModule services:
- Reads `X-Session-Id` header from the incoming request.
- Calls `KeyStoreService.retrieve(sessionId)` to obtain the AES key.
- Uses `CryptoService`'s raw AES primitives (via injected `aesEncrypt`/`aesDecrypt`) for request/response bodies — NOT `encryptAtRest` (different key, different purpose).
- Routes marked `@EncryptedOnly()` but with no valid session key return 401 `ENCRYPTED_SESSION_REQUIRED`.

### 8.6 — Crypto Module (`src/crypto/crypto.module.ts`)

```
Providers (in registration order):
- MasterKeyProvider (provides CRYPTO_REST_KEY, CRYPTO_TOKEN_KEY).
- CryptoService (injects CRYPTO_REST_KEY).
- KeyStoreService (injects RedisService).
- KeyExchangeService (injects KeyStoreService).

Exports: CryptoService, KeyStoreService, KeyExchangeService.

Not global. Imported explicitly by: AuthModule (for MFA), AppModule (for EncryptionInterceptor registration).
```

Module lifecycle:
- `OnModuleInit`: MasterKeyProvider loads and validates the master key; logs key fingerprint.
- `OnModuleDestroy`: no-op (no persistent connections owned by this module; Redis client is owned by RedisModule).

---

## Phase 9: Audit Module

### 9.1 — Audit Service (`src/audit/audit.service.ts`)

Append-only, hash-chained audit log:
- `log(entry: AuditEntry): Promise<void>` — writes an entry to the `audit_logs` table via PRISMA_WRITE.
- Before writing: fetches the `currentHash` of the most recent entry. Computes `currentHash` of the new entry as `SHA-256(action + userId + resource + detail + ipHash + region + requestId + previousHash + createdAt)`. Stores both `previousHash` and `currentHash`.
- If no previous entry exists (first entry ever), `previousHash` is a known seed value: `SHA-256('allservices-audit-genesis')`.
- This creates a chain where tampering with any entry invalidates all subsequent hashes.

`AuditEntry` input type:
- `action` — string (from the defined action list).
- `userId` — string or null.
- `resource` — string or null.
- `detail` — object or null.
- `ipHash` — string.
- `userAgent` — string or null.
- `region` — string.
- `requestId` — string.

### 9.2 — Audit Interceptor (`src/audit/audit.interceptor.ts`)

Optional interceptor that can be applied per-route to automatically create audit entries after successful handler execution. Reads metadata from a `@Audited(action)` decorator. Extracts user, IP, request ID from the request context.

For auth module routes, audit logging is done explicitly in the service (not via interceptor) because the audit context varies per action (e.g. failed login has no user ID, MFA has additional detail).

---

## Phase 10: Health Module

### 10.1 — Health Controller (`src/health/health.controller.ts`)

Three endpoints, all decorated with `@Public()`:

**`GET /v1/health`** — liveness probe.
- Returns `{ status: 'ok', region, role, timestamp }`.
- No dependency checks. If the process is alive, this returns 200.
- Used by PM2 and Docker HEALTHCHECK.

**`GET /v1/health/ready`** — readiness probe.
- Uses `@nestjs/terminus` `HealthCheckService`.
- Checks: database read (PrismaHealth), database write (PrismaHealth), Redis (RedisHealth), replica lag (RegionHealth).
- Returns detailed check results with latencies.
- Returns `writable: true/false` based on region service.
- If any critical check fails, returns HTTP 503.
- Used by Cloudflare health checks to decide routing.

**`GET /v1/health/deep`** — detailed diagnostic (protected, not public — requires admin role or internal secret).
- All checks from ready plus: memory usage, disk usage, active connections, queue stats, Sentry connectivity, PostHog connectivity.
- Not used for automated routing. Used for debugging.

---

## Phase 11: Mail Module

The mail module owns all outbound transactional email. Every method is a thin producer that enqueues a BullMQ job — actual SMTP calls happen in the queue processor (Phase 12). No request handler ever blocks on SMTP.

### 11.1 — SMTP Transport (`src/mail/smtp.transport.ts`)

Builds and exports a configured nodemailer transport. One instance per process, reused across all sends.

Configuration (from `mail.config.ts`):
- `host`, `port`, `user`, `pass`, `from` — from env.
- `secure: port === 465` (implicit TLS).
- `requireTLS: true` — enforces STARTTLS for port 587.
- `pool: true` — maintains a pool of SMTP connections.
- `maxConnections: 5` — cap concurrent SMTP connections per worker.
- `maxMessages: 100` — rotate connection after 100 messages to avoid provider rate-limit quirks.
- `rateLimit: 10` — max 10 messages per second across the pool.
- `connectionTimeout: 10_000`, `greetingTimeout: 10_000`, `socketTimeout: 20_000`.

On init: calls `transport.verify()` to confirm SMTP reachability. Logs `mail.transport.ready` on success. Logs `mail.transport.unreachable` and exits process on failure in production (fail-fast). In development, logs a warning and falls back to the console transport (below).

Console transport (development only):
- When `NODE_ENV !== 'production'` and `SMTP_HOST` is unset, the module binds a stub transport that writes the full email payload to the Pino logger at `info` level under the `mail.dev` context, and to a file at `./.tmp/mail/{timestamp}-{to}-{subject}.eml`.
- Never attempts an SMTP connection in this mode — safe for offline development.

### 11.2 — Templates (`src/mail/templates/`)

Each email has a TypeScript module exporting `subject`, `text`, and `html` builder functions. Templates are plain TS template literals — no external templating engine. Centralised so the service can swap to Handlebars/MJML later without touching the service interface.

Template files:
- `verification.template.ts` — welcome + verify-email link.
- `password-reset.template.ts` — reset link with 1-hour expiry warning.
- `login-notification.template.ts` — new-device/location alert with revoke-sessions link.
- `account-locked.template.ts` — lock reason, unlock-time or contact-support instructions.
- `mfa-enabled.template.ts` — confirmation with recovery-codes reminder.
- `password-changed.template.ts` — confirmation with "if this wasn't you" link.

Each template exports:
```
export const verificationTemplate = {
  subject: (name?: string) => `${name ? name + ', welcome' : 'Welcome'} to AllServices`,
  text: (input: VerificationInput) => `...plain text body with {{verifyUrl}}...`,
  html: (input: VerificationInput) => `<!doctype html><html>...</html>`,
};
```

Shared layout helpers (`templates/_layout.ts`):
- `renderHtmlLayout(bodyHtml: string): string` — wraps inner HTML in the standard AllServices shell (logo, footer, unsubscribe note — transactional only, no marketing unsubscribe).
- `buildUrl(path: string, params: Record<string, string>): string` — constructs URLs with `https://allservices.cc` as base (override via `APP_WEB_URL` config).

Every template:
- Includes both `text` and `html` output.
- No tracking pixels, no remote images — all images inlined as base64 or omitted.
- Footer: `AllServices — ALS Marketing UK Ltd — Unit X, London, UK`. Legal-compliant sender address.
- No external links other than `https://allservices.cc/*` destinations.

### 11.3 — Mail DTOs (`src/mail/dto/`)

Typed inputs for each template, used as the job payload contract:
- `VerificationInput` — `{ to: string; name?: string; token: string; expiresAt: string }`.
- `PasswordResetInput` — `{ to: string; name?: string; token: string; expiresAt: string }`.
- `LoginNotificationInput` — `{ to: string; name?: string; device: string; ipHash: string; city?: string; country?: string; loginAt: string }`.
- `AccountLockedInput` — `{ to: string; name?: string; reason: string; lockedUntil?: string }`.
- `MfaEnabledInput` — `{ to: string; name?: string }`.
- `PasswordChangedInput` — `{ to: string; name?: string; changedAt: string; ipHash: string }`.

Each DTO has class-validator decorators. MailProcessor validates the payload before rendering — bad payloads fail fast with a clear error in the job failure record.

### 11.4 — Mail Service (`src/mail/mail.service.ts`)

Public interface for the rest of the app. Every method enqueues a BullMQ job on the `mail` queue — never sends directly.

Injects: `@InjectQueue('mail') mailQueue: Queue`, `LoggerService`, `MetricsService`.

Methods (one per template):
- `sendVerificationEmail(input: VerificationInput): Promise<void>` — adds job `send-verification` with `input` as payload. Job options: `attempts: 3`, `backoff: { type: 'exponential', delay: 2000 }`, `removeOnComplete: 1000`, `removeOnFail: 5000`.
- `sendPasswordResetEmail(input: PasswordResetInput): Promise<void>` — same pattern, job name `send-password-reset`.
- `sendLoginNotification(input: LoginNotificationInput): Promise<void>` — job name `send-login-notification`. Lower priority (`priority: 10`) — informational, not blocking.
- `sendAccountLockedEmail(input: AccountLockedInput): Promise<void>` — job name `send-account-locked`.
- `sendMfaEnabledEmail(input: MfaEnabledInput): Promise<void>` — job name `send-mfa-enabled`.
- `sendPasswordChangedEmail(input: PasswordChangedInput): Promise<void>` — job name `send-password-changed`.

Every method:
- Records metric `mail_enqueued_total{type, region}`.
- Logs `mail.enqueued` with `jobId`, `type`, `to` (redacted email).
- Never blocks on the job — returns as soon as Redis confirms the enqueue.

The service does NOT expose a raw `send()` method. Adding a new email type requires adding a template, a DTO, a service method, and a processor case — deliberately gated to prevent ad-hoc sends bypassing the queue.

### 11.5 — Mail Module (`src/mail/mail.module.ts`)

```
Imports: BullModule.registerQueue({ name: 'mail' }), ObservabilityModule.
Providers: SmtpTransport (factory), MailService.
Exports: MailService.
```

Not global. Imported explicitly by AuthModule (for verification/reset/MFA/login notifications) and any future module that sends email.

---

## Phase 12: Queue Module

Owns all background-job infrastructure via BullMQ. Every async workload (outbound email, async audit writes, scheduled clean-up) runs as a queue job. Handlers never block on I/O that can be deferred.

### 12.1 — Queue Connection (`src/queue/queue-connection.provider.ts`)

BullMQ requires a dedicated Redis connection — reusing the app's main ioredis client causes head-of-line blocking on blocking Redis commands (`BRPOPLPUSH`). Connection config:

- Creates a second ioredis instance with the same `REDIS_URL`, `REDIS_TLS`, and `REDIS_KEY_PREFIX` as the main client.
- Overrides `maxRetriesPerRequest: null` (BullMQ requirement — blocking commands must never time out at the client level).
- Overrides `enableReadyCheck: false` (BullMQ recommendation for stability during Redis restarts).
- Key prefix is scoped to `as:{region}:bull:` so BullMQ keys are isolated from app cache keys.

Exposed as injection token `BULL_CONNECTION`. One connection shared across all queue registrations.

### 12.2 — Queue Module (`src/queue/queue.module.ts`)

Global module. Registers all queues and binds processors.

```
Imports:
- BullModule.forRootAsync — provides BULL_CONNECTION as the shared ioredis connection.
- BullModule.registerQueue — one call per queue name.

Queues registered:
- { name: 'mail' } — outbound transactional email.
- { name: 'audit' } — async audit log writes (enabled when sync writes become a bottleneck).
- { name: 'maintenance' } — scheduled clean-up (expired sessions, stale refresh-token families, orphaned crypto session keys).

Providers:
- MailProcessor.
- AuditProcessor.
- MaintenanceProcessor.
- QueueEventsListener (one instance per queue, listens to queue-wide events).
- QueueMetricsService.

Exports: BullModule (re-exports registered queues for injection elsewhere via @InjectQueue).
```

Default job options (set on each `registerQueue` call):
- `removeOnComplete: { age: 3600, count: 1000 }` — keep completed jobs for 1 hour or last 1000, whichever comes first.
- `removeOnFail: { age: 86400, count: 5000 }` — keep failed jobs for 24 hours or last 5000.
- `attempts: 3`.
- `backoff: { type: 'exponential', delay: 1000 }` — 1s, 2s, 4s.
- `timeout: 30_000` — jobs killed after 30 seconds.

### 12.3 — Mail Processor (`src/queue/processors/mail.processor.ts`)

Worker for the `mail` queue.

- Decorated with `@Processor('mail', { concurrency: 5 })` — five jobs in flight per worker.
- Injects: `SmtpTransport`, `MetricsService`, `SentryService`, `PostHogService`.
- Dispatches on `job.name`:
    - `send-verification` → renders `verificationTemplate`, calls `transport.sendMail`.
    - `send-password-reset` → renders `passwordResetTemplate`, calls `transport.sendMail`.
    - `send-login-notification`, `send-account-locked`, `send-mfa-enabled`, `send-password-changed` — same pattern.
- Each handler:
    1. Validates the job payload against the DTO (class-validator). Throws on validation failure → job marked failed with clear error.
    2. Renders subject/text/html from the template.
    3. Calls `transport.sendMail({ from, to, subject, text, html })`.
    4. Records metric `mail_sent_total{type, status, region}` and `mail_send_duration_seconds{type, region}`.
    5. On exception: rethrows so BullMQ handles retry/backoff.
- After `attempts` exhausted, BullMQ fires `failed` event → QueueEventsListener forwards to Sentry with job name, attempt count, and last error.

### 12.4 — Audit Processor (`src/queue/processors/audit.processor.ts`)

Worker for the `audit` queue. Present but disabled by default — controlled by `AUDIT_ASYNC_ENABLED` config flag.

When enabled:
- `AuditService.log()` enqueues instead of writing inline.
- Worker concurrency is **1**. The hash chain requires serial writes — parallel workers would race on `previousHash` lookup and corrupt the chain.
- Worker name: `audit-writer`. BullMQ single-worker concurrency enforced by checking `worker.concurrency === 1` at startup; throws on mis-configuration.
- On failure, the job retries with the same backoff. After retries exhausted, the entry is written to a `audit_dead_letter` Redis list (`as:{region}:audit:dead-letter`) and an alert fires in Sentry — audit entries must never be silently dropped.
- Dead-letter entries are replayed by the maintenance processor once per hour.

When disabled (default for MVP):
- Auditing remains synchronous. Processor registration still runs but no jobs are enqueued. The processor is a no-op, present so enabling the flag is a config change only.

### 12.5 — Maintenance Processor (`src/queue/processors/maintenance.processor.ts`)

Worker for the `maintenance` queue. Runs scheduled clean-up jobs.

Scheduled jobs (added via `queue.add` with `repeat` options on module init):
- `prune-expired-sessions` — runs every 15 minutes. Deletes Redis keys matching `as:{region}:session:*` where TTL has expired (defensive — TTL should do this, but we also sweep for keys that leaked due to ops incidents).
- `prune-expired-refresh-families` — runs every hour. Calls `SessionService.pruneExpiredFamilies()` which deletes `RefreshTokenFamily` rows where `expiresAt < now` via PRISMA_WRITE.
- `prune-orphaned-crypto-keys` — runs every 30 minutes. Scans `as:{region}:crypto:*` keys and removes any whose referenced session no longer exists.
- `replay-audit-dead-letter` — runs every hour. Drains the audit dead-letter list and re-enqueues entries to the `audit` queue.

Each scheduled job uses a unique `jobId` based on the job name + timestamp to prevent duplicate enqueue if the worker restarts mid-run.

### 12.6 — Queue Events Listener (`src/queue/queue-events.listener.ts`)

One instance per queue. Subscribes to the queue's event stream (`QueueEvents` from BullMQ) and forwards to observability.

Listens on:
- `completed` → metric `queue_job_completed_total{queue, name, region}`, log at debug level.
- `failed` → metric `queue_job_failed_total{queue, name, region}`, log at warn level. If `attemptsMade >= job.opts.attempts`, escalates to Sentry with full job data (payload redacted — passwords/tokens never logged).
- `stalled` → metric `queue_job_stalled_total{queue, region}`, log at warn level. Stalled jobs are jobs that locked up mid-execution (worker crash or hang) — BullMQ auto-retries them.
- `active` → increment gauge `queue_active_jobs{queue, region}`.
- `waiting` → update gauge `queue_waiting_jobs{queue, region}`.

### 12.7 — Queue Metrics Service (`src/queue/queue-metrics.service.ts`)

Polls queue stats every 30 seconds and updates Prometheus gauges.

Per queue:
- `queue_depth_total{queue, state, region}` — gauge for `waiting`, `active`, `delayed`, `completed`, `failed` counts, from `queue.getJobCounts()`.
- `queue_oldest_waiting_age_seconds{queue, region}` — age of the oldest waiting job, from `queue.getWaiting(0, 0)`. Alerts fire if this exceeds 300s (5 minutes) in production — indicates worker starvation.

Runs on a `setInterval` registered in `OnModuleInit`. Interval is cleared in `OnModuleDestroy` for clean shutdown.

### 12.8 — Graceful Shutdown

The QueueModule implements `OnModuleDestroy`:
1. Calls `worker.close()` on every BullMQ worker. This stops accepting new jobs and waits for active jobs to finish (up to 30s — the job `timeout`).
2. Closes the shared `BULL_CONNECTION` ioredis client.
3. Logs `queue.shutdown.complete` when done.

Shutdown is coordinated with NestJS shutdown hooks (enabled in main.ts). SIGTERM → health returns 503 → NestJS destroys modules in reverse-dependency order → QueueModule drains before the app exits.

---

## Phase 13: main.ts Bootstrap

### 13.1 — Full Bootstrap Sequence

The `main.ts` file is the single most important file for security. Every line matters. The order matters.

```
1. Create NestJS app with bufferLogs: true.
2. Set trust proxy to 1 (behind Cloudflare).
3. Attach Pino logger.
4. Apply Helmet with full CSP directives.
5. Apply cookie-parser.
6. Enable CORS with strict origin list from config.
7. Set global prefix 'v1'.
8. Enable URI versioning with default version '1'.
9. Apply global ValidationPipe (whitelist, forbidNonWhitelisted, transform, 422 status).
10. Apply global AllExceptionsFilter.
11. Apply global interceptors in order:
    a. RegionInterceptor (outermost — attaches region context).
    b. LoggingInterceptor.
    c. TimeoutInterceptor (30s default).
    d. TransformInterceptor (wraps responses).
    e. SerializerInterceptor (strips @Exclude fields).
12. Apply body parser limits: JSON 1MB, urlencoded 1MB.
13. Register Swagger (disabled in production).
14. Enable shutdown hooks.
15. Listen on 0.0.0.0:PORT.
16. Send 'ready' signal to PM2.
17. Log startup message with region, role, port.
```

CORS allowed origins from config:
```
https://allservices.cc
https://www.allservices.cc
https://dashboard.allservices.cc
https://legal.allservices.cc
```

CORS settings:
- `credentials: true`.
- Methods: GET, POST, PUT, PATCH, DELETE.
- Allowed headers: Content-Type, Authorization, X-Request-Id, X-Idempotency-Key, X-Client-Version, X-Client-Platform.
- Exposed headers: X-Request-Id, X-RateLimit-Remaining, X-RateLimit-Reset, X-Region, X-Read-Only.
- Max age: 86400 (1 day preflight cache).

Helmet directives: default-src 'self', script-src 'self', style-src 'self', img-src 'self', connect-src 'self', font-src 'self', object-src 'none', frame-src 'none', base-uri 'self', form-action 'self'. HSTS max-age 31536000 with includeSubDomains and preload. Referrer-Policy strict-origin-when-cross-origin.

### 13.2 — App Module

The root `app.module.ts` imports in this order:
1. ConfigModule (global).
2. LoggerModule (Pino).
3. ThrottlerModule (global rate limiting with Redis store).
4. EventEmitterModule.
5. DatabaseModule.
6. RedisModule.
7. ObservabilityModule (Sentry, PostHog, Metrics).
8. RegionModule.
9. CryptoModule.
10. AuditModule.
11. HealthModule.
12. MailModule.
13. QueueModule.
14. UserModule (first business module — owns the User entity).
15. AuthModule (consumes UserService for all user persistence).

Global guards registered as APP_GUARD (executed in this order):
- JwtAuthGuard (authenticates and attaches `req.user`).
- PermissionsGuard (primary authorization — checks `@RequirePermission` / `@RequireAnyPermission` against `req.user.permissions` from JWT).
- RolesGuard (legacy role-name check — runs after PermissionsGuard, allows by default unless `@Roles()` is present).
- ThrottlerBehindProxyGuard.

The guard order matters: JwtAuthGuard must populate `req.user` before PermissionsGuard can read `req.user.permissions`. PermissionsGuard is the gatekeeper for nearly every endpoint; RolesGuard is a second-line check for the few endpoints that semantically need a role-name assertion.

Middleware applied in `configure()`:
- RequestIdMiddleware on all routes.
- CorrelationIdMiddleware on all routes.
- RealIpMiddleware on all routes.

---

## Phase 14: User Module (First Business Module)

This module owns the `User` entity. Every module that reads or writes user data goes through `UserService`. The Auth module delegates all user persistence to this module — it never touches `PRISMA_READ` or `PRISMA_WRITE` for the User table directly.

### 14.1 — User Module Structure

```
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.mapper.ts
├── dto/
│   ├── update-profile.dto.ts
│   ├── admin-create-user.dto.ts
│   ├── admin-update-user.dto.ts
│   ├── list-users.dto.ts
│   ├── lock-user.dto.ts
│   └── user-response.dto.ts
├── interfaces/
│   ├── user-safe.interface.ts
│   └── user-with-secrets.interface.ts
└── guards/
    └── self-or-admin.guard.ts
```

### 14.2 — DTOs

Every DTO uses `class-validator` decorators. Every field validated. No `any` types.

**`update-profile.dto.ts`** (self-service profile update):
- `firstName` — `@IsOptional()`, `@IsString()`, `@MinLength(1)`, `@MaxLength(100)`, `@Transform` to trim.
- `lastName` — `@IsOptional()`, `@IsString()`, `@MinLength(1)`, `@MaxLength(100)`, `@Transform` to trim.
- At least one field required — enforced with a custom `@AtLeastOneField(['firstName', 'lastName'])` class-validator constraint.

**`admin-create-user.dto.ts`** (admin-only creation, bypasses self-register):
- `email` — `@IsEmail()`, `@Transform` to lowercase and trim, `@MaxLength(255)`.
- `password` — `@IsString()`, `@MinLength(12)`, `@MaxLength(128)`.
- `firstName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.
- `lastName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.
- `roles` — `@IsArray()`, `@ArrayNotEmpty()`, `@IsIn(['user', 'admin', 'tenant-admin'], { each: true })`.
- `tenantId` — `@IsOptional()`, `@IsUUID()`.
- `emailVerified` — `@IsOptional()`, `@IsBoolean()`. Defaults to false.

**`admin-update-user.dto.ts`** (admin-only mutation):
- `firstName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.
- `lastName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.
- `roles` — `@IsOptional()`, `@IsArray()`, `@ArrayNotEmpty()`, `@IsIn(['user', 'admin', 'tenant-admin'], { each: true })`.
- `isActive` — `@IsOptional()`, `@IsBoolean()`.
- `tenantId` — `@IsOptional()`, `@IsUUID()`.
- `emailVerified` — `@IsOptional()`, `@IsBoolean()`.
- At least one field required.

**`list-users.dto.ts`** (admin query params):
- `page` — `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`. Default 1.
- `pageSize` — `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, `@Max(100)`. Default 20.
- `search` — `@IsOptional()`, `@IsString()`, `@MaxLength(255)`, `@Transform` to trim. Matches `email`, `firstName`, `lastName`.
- `role` — `@IsOptional()`, `@IsIn(['user', 'admin', 'tenant-admin'])`.
- `isActive` — `@IsOptional()`, `@Type(() => Boolean)`, `@IsBoolean()`.
- `isLocked` — `@IsOptional()`, `@Type(() => Boolean)`, `@IsBoolean()`.
- `tenantId` — `@IsOptional()`, `@IsUUID()`.
- `includeDeleted` — `@IsOptional()`, `@Type(() => Boolean)`, `@IsBoolean()`. Default false.
- `sortBy` — `@IsOptional()`, `@IsIn(['createdAt', 'updatedAt', 'email', 'lastLoginAt'])`. Default `createdAt`.
- `sortOrder` — `@IsOptional()`, `@IsIn(['asc', 'desc'])`. Default `desc`.

**`lock-user.dto.ts`** (admin lock action):
- `reason` — `@IsString()`, `@MinLength(1)`, `@MaxLength(255)`, `@Transform` to trim.
- `durationMinutes` — `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, `@Max(525600)`. If omitted, lock is indefinite until explicitly unlocked.

**`user-response.dto.ts`** (outward-facing shape):
- `id` — UUID.
- `email` — string.
- `firstName` — string or null.
- `lastName` — string or null.
- `roles` — string array.
- `isActive` — boolean.
- `isLocked` — boolean.
- `lockReason` — string or null.
- `lockedUntil` — ISO date string or null.
- `emailVerified` — boolean.
- `mfaEnabled` — boolean.
- `tenantId` — UUID or null.
- `lastLoginAt` — ISO date string or null.
- `createdAt` — ISO date string.
- `updatedAt` — ISO date string.
- NEVER includes `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `lastLoginIp`, `failedLoginAttempts`.

### 14.3 — Interfaces

**`user-safe.interface.ts`** — All non-secret User fields. Return type for every public `UserService` method. Attached to `req.user` after JWT strategy validation:
```
{
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  roles: string[]
  isActive: boolean
  isLocked: boolean
  lockReason: string | null
  lockedUntil: Date | null
  emailVerified: boolean
  mfaEnabled: boolean
  tenantId: string | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

**`user-with-secrets.interface.ts`** — `UserSafe` plus `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `failedLoginAttempts`, `lastLoginIp`, `passwordChangedAt`. Used only by Auth module for credential verification and MFA verification. Returned only from explicitly named `...WithSecrets` methods.

### 14.4 — User Mapper (`user.mapper.ts`)

Exposes pure functions:
- `toSafe(user: User): UserSafe` — strips all secret fields.
- `toResponse(user: User | UserSafe): UserResponseDto` — maps to external response shape, serialises dates to ISO strings.
- `toSafeList(users: User[]): UserSafe[]` — batch mapper.

Every controller response and every cross-module return uses the mapper. The raw Prisma `User` shape never leaves the module.

### 14.5 — Self-Or-Admin Guard (`guards/self-or-admin.guard.ts`)

CanActivate guard that compares `request.params.id` to `request.user.id`. Returns true if they match OR if `request.user.roles` contains `admin`. Otherwise throws `ForbiddenException` with code `FORBIDDEN_USER_ACCESS`. Applied via `@UseGuards(SelfOrAdminGuard)` on routes where a user may access their own record but not others'.

### 14.6 — User Service (`user.service.ts`)

Owns the `User` Prisma model. Injects: `@Inject('PRISMA_READ')`, `@Inject('PRISMA_WRITE')`, AuditService, PostHogService, EventEmitter2, RegionConfig, UserMapper.

**Read methods** (all use PRISMA_READ, all filter `deletedAt: null` unless noted):
- `findById(id: string): Promise<UserSafe | null>` — returns safe user or null.
- `findByIdOrFail(id: string): Promise<UserSafe>` — throws `NotFoundException` with code `USER_NOT_FOUND` if missing.
- `findByEmail(email: string): Promise<UserSafe | null>` — normalises email (lowercase, trim) before lookup.
- `findByIdWithSecrets(id: string): Promise<UserWithSecrets | null>` — Auth-only; includes passwordHash, mfaSecret, mfaRecoveryCodes, failedLoginAttempts, passwordChangedAt.
- `findByEmailWithSecrets(email: string): Promise<UserWithSecrets | null>` — Auth-only.
- `existsByEmail(email: string): Promise<boolean>` — existence check without loading the row.
- `list(query: ListUsersDto, actor: UserSafe, actorPermissions: PermissionCode[]): Promise<{ items: UserResponseDto[], total: number, page: number, pageSize: number }>`:
    - Tenant scoping: if actor has `USER_LIST_ANY`, allow unscoped query (respecting any explicit `tenantId` filter the caller provided). Otherwise force `tenantId = actor.tenantId`.
    - Applies search, role, isActive, isLocked, tenantId filters.
    - Applies `includeDeleted` only when actor has `USER_LIST_ANY`; silently ignored otherwise.
    - Returns paginated items mapped through UserMapper.

**Write methods** (all use PRISMA_WRITE):
- `create(data: { email: string, passwordHash: string, firstName?: string, lastName?: string, roles?: string[], tenantId?: string | null, emailVerified?: boolean }): Promise<UserSafe>`:
    - Normalises email.
    - Throws `ConflictException` with code `EMAIL_ALREADY_EXISTS` if email taken (catches Prisma `P2002`).
    - Defaults: `roles = ['user']`, `isActive = true`, `isLocked = false`, `emailVerified = false`.
    - Logs to audit: `user.created`.
    - Emits event: `user.created` with `{ userId, email, region }`.
    - Returns safe user.
- `adminCreate(data: AdminCreateUserDto, actor: UserSafe): Promise<UserSafe>`:
    - Hashes the password via PasswordService (injected from Auth module's exports).
    - Delegates to `create()` with full fields.
    - Logs to audit: `user.admin.created` with actor ID and target ID.
- `updateProfile(userId: string, data: UpdateProfileDto): Promise<UserSafe>`:
    - Updates `firstName`, `lastName` (only provided fields).
    - Logs to audit: `user.profile.updated` with changed fields.
    - Returns updated safe user.
- `adminUpdate(userId: string, data: AdminUpdateUserDto, actor: UserSafe, actorPermissions: PermissionCode[]): Promise<UserSafe>`:
    - Tenant scoping: if actor lacks `USER_WRITE_ANY`, load target and verify `target.tenantId === actor.tenantId`; mismatch returns `NotFoundException` (never 403, to avoid cross-tenant enumeration).
    - Permission-gated field updates: only callers with `USER_WRITE_ANY` may change `roles` or `tenantId`. A `tenant-admin` with only `USER_WRITE_TENANT` sending `roles` in the payload gets a 403 with code `FORBIDDEN` and detail `forbidden_field: 'roles'`.
    - Updates provided fields.
    - If `isActive` flipped to false: emits `user.deactivated` event (Auth listens to revoke sessions).
    - If `roles` changed: emits `user.roles.changed` event.
    - Logs to audit: `user.admin.updated` with actor ID, target ID, and diff of changed fields.
    - Returns updated safe user.
- `updatePassword(userId: string, passwordHash: string): Promise<void>`:
    - Sets `passwordHash`, `passwordChangedAt = now`.
    - Does NOT revoke sessions — caller is responsible for session revocation.
    - Logs to audit: `user.password.updated`.
- `markEmailVerified(userId: string): Promise<void>`:
    - Sets `emailVerified = true`.
    - Idempotent — no audit/event emission if already verified.
    - Logs to audit: `user.email.verified`.
- `recordLoginSuccess(userId: string, ipHash: string): Promise<void>`:
    - Sets `lastLoginAt = now`, `lastLoginIp = ipHash`, `failedLoginAttempts = 0`, `isLocked = false`, `lockReason = null`, `lockedUntil = null` (auto-unlock on successful login if lock has expired naturally).
- `incrementFailedLoginAttempts(userId: string): Promise<number>`:
    - Atomic increment via Prisma `increment`. Returns new count.
- `lock(userId: string, reason: string, until: Date | null, actorId: string | null, actorTenantId?: string | null): Promise<void>`:
    - If `actorId` is non-null and `actorTenantId` is provided (i.e. caller has `USER_LOCK_TENANT` but not `USER_LOCK_ANY`): load target and verify `target.tenantId === actorTenantId`; mismatch returns `NotFoundException`.
    - If `actorId` is null (system action like too-many-failed-logins), skip the tenant check.
    - Sets `isLocked = true`, `lockReason`, `lockedUntil` (null = indefinite).
    - Emits `user.locked` event (Auth listens to revoke sessions).
    - Logs to audit: `user.locked` with reason, until, actor (`null` = system).
- `unlock(userId: string, actorId: string, actorTenantId?: string | null): Promise<void>`:
    - Tenant scoping: same rule as `lock` when `actorTenantId` is provided.
    - Sets `isLocked = false`, `lockReason = null`, `lockedUntil = null`, `failedLoginAttempts = 0`.
    - Logs to audit: `user.unlocked` with actor.
- `setMfaSecret(userId: string, encryptedSecret: string, hashedRecoveryCodes: string[]): Promise<void>`:
    - Sets `mfaSecret`, `mfaRecoveryCodes`, `mfaEnabled = true`.
    - Logs to audit: `user.mfa.secret.set`.
- `clearMfa(userId: string): Promise<void>`:
    - Sets `mfaSecret = null`, `mfaRecoveryCodes = []`, `mfaEnabled = false`.
    - Logs to audit: `user.mfa.cleared`.
- `consumeRecoveryCode(userId: string, hashedCode: string): Promise<void>`:
    - Loads user, removes exactly one matching code from `mfaRecoveryCodes`, persists.
    - Throws `NotFoundException` with code `RECOVERY_CODE_NOT_FOUND` if not present.
- `softDelete(userId: string, actorId: string): Promise<void>`:
    - Sets `deletedAt = now`, `isActive = false`.
    - Emits `user.deleted` event (Auth listens to revoke sessions).
    - Logs to audit: `user.deleted` with actor.
- `restore(userId: string, actorId: string): Promise<void>`:
    - Sets `deletedAt = null`, `isActive = true`.
    - Logs to audit: `user.restored` with actor.

Every method:
- Wraps Prisma calls with known-error handling: `P2002` → `ConflictException`, `P2025` → `NotFoundException`.
- Uses UserMapper before returning safe data to callers.
- Never exposes `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `lastLoginIp`, `failedLoginAttempts` via a non-`...WithSecrets` method.

### 14.7 — User Controller (`user.controller.ts`)

All routes under `/v1/users`. Every route authenticated (no `@Public()`). Every route declares its required permission via `@RequirePermission` or `@RequireAnyPermission` — guards enforce authorization from the JWT's `permissions` array, services enforce tenant scoping on the data.

```
GET    /v1/users/me            @RequirePermission(USER_READ_SELF)                                       @ReadOperation()
PATCH  /v1/users/me            @RequirePermission(USER_WRITE_SELF)                                      @WriteOperation()
GET    /v1/users/:id           @RequireAnyPermission(USER_READ_SELF, USER_READ_TENANT, USER_READ_ANY)   @ReadOperation()
GET    /v1/users               @RequireAnyPermission(USER_LIST_TENANT, USER_LIST_ANY)  @RateLimit(60, 60)
POST   /v1/users               @RequirePermission(USER_CREATE)          @RateLimit(20, 60)  @WriteOperation()
PATCH  /v1/users/:id           @RequireAnyPermission(USER_WRITE_TENANT, USER_WRITE_ANY)                 @WriteOperation()
DELETE /v1/users/:id           @RequirePermission(USER_DELETE)                                          @WriteOperation()
POST   /v1/users/:id/restore   @RequirePermission(USER_RESTORE)                                         @WriteOperation()
POST   /v1/users/:id/lock      @RequireAnyPermission(USER_LOCK_TENANT, USER_LOCK_ANY)                   @WriteOperation()
POST   /v1/users/:id/unlock    @RequireAnyPermission(USER_LOCK_TENANT, USER_LOCK_ANY)                   @WriteOperation()
```

Authorization flow per route:
- **`USER_READ_SELF`-only routes** — PermissionsGuard checks `req.user.id === req.params.id` (or equivalent). If not self, guard fails with 403.
- **`_TENANT`-scoped permissions** — Guard passes on capability. UserService enforces `target.tenantId === actor.tenantId` in the read/write; cross-tenant attempts return `NotFoundException` (never a 403, to avoid leaking which users exist in other tenants).
- **`_ANY`-scoped permissions** — Guard passes on capability. No tenant filter applied in service.
- **OR semantics via `@RequireAnyPermission`** — first matching permission wins. UserService inspects `req.user.permissions` to decide whether to apply the tenant filter (tenant-scoped perm present and any-scoped perm absent → filter by tenant).

Route specifics:
- `GET /v1/users/me` — returns current user profile. Reads from `req.user` (already loaded by JWT strategy), then queries fresh via `UserService.findByIdOrFail(req.user.id)` to return up-to-date data through the mapper.
- `PATCH /v1/users/me` — body is `UpdateProfileDto`. Calls `UserService.updateProfile(req.user.id, dto)`.
- `GET /v1/users/:id` — allowed when caller has `USER_READ_SELF` (and `:id === req.user.id`), or `USER_READ_TENANT` (and target is in same tenant), or `USER_READ_ANY`. Guard short-circuits as soon as one matches.
- `GET /v1/users` — body is `ListUsersDto`. Passes `req.user` to `UserService.list` for tenant scoping.
- `POST /v1/users` — body is `AdminCreateUserDto`. Calls `UserService.adminCreate`.
- `PATCH /v1/users/:id` — body is `AdminUpdateUserDto`. Calls `UserService.adminUpdate`.
- `DELETE /v1/users/:id` — calls `UserService.softDelete`.
- `POST /v1/users/:id/restore` — calls `UserService.restore`.
- `POST /v1/users/:id/lock` — body is `LockUserDto`. Computes `lockedUntil = now + durationMinutes` (or null). Calls `UserService.lock`.
- `POST /v1/users/:id/unlock` — calls `UserService.unlock`.

Every controller method:
- Has explicit return type.
- Uses DTOs for request bodies.
- Uses ParseUUIDPipe for ID parameters.
- Has `@ApiOperation()` and `@ApiResponse()` decorators for Swagger.
- Is thin — delegates to UserService immediately.

### 14.8 — User Module Registration

The user module:
- Imports: DatabaseModule, ObservabilityModule, AuditModule, EventEmitterModule, forwardRef(() => AuthModule) (for PasswordService used in `adminCreate`).
- Provides: UserService, UserMapper, SelfOrAdminGuard.
- Controllers: UserController.
- Exports: UserService, UserMapper (AuthModule and all future modules consume these).

Cross-module event contract (published by UserService, consumed by Auth):
- `user.created` — `{ userId: string, email: string, region: string }`.
- `user.deactivated` — `{ userId: string, region: string }`. Auth revokes all sessions.
- `user.deleted` — `{ userId: string, region: string }`. Auth revokes all sessions.
- `user.locked` — `{ userId: string, reason: string, lockedUntil: Date | null, region: string }`. Auth revokes all sessions.
- `user.roles.changed` — `{ userId: string, oldRoles: string[], newRoles: string[], region: string }`. Auth may log additional audit entry but does not revoke sessions (role changes take effect on next token refresh).

---

## Phase 15: Auth Module

This is the complete authentication system. Every endpoint, every service method, every edge case. All user persistence is delegated to `UserService` (Phase 14) — this module never touches the `User` table directly.

### 15.1 — Auth Module Structure

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── token.service.ts
├── password.service.ts
├── mfa.service.ts
├── session.service.ts
├── strategies/
│   └── jwt.strategy.ts
├── listeners/
│   └── user-events.listener.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   ├── change-password.dto.ts
│   ├── verify-email.dto.ts
│   ├── enable-mfa.dto.ts
│   ├── verify-mfa.dto.ts
│   ├── disable-mfa.dto.ts
│   ├── revoke-session.dto.ts
│   └── auth-response.dto.ts
├── interfaces/
│   ├── jwt-payload.interface.ts
│   └── token-pair.interface.ts
└── guards/
    └── mfa.guard.ts
```

### 15.2 — JWT Strategy (`strategies/jwt.strategy.ts`)

Extends `PassportStrategy(Strategy)`. Injects `UserService`:
- Extracts token from: Authorization Bearer header (desktop clients) OR `__Host-session` cookie (web clients). The strategy checks both locations.
- Secret: `JWT_PUBLIC_KEY` (public key for RS256 verification).
- Algorithm: RS256.
- Validates: issuer, audience, expiration (built into passport-jwt).
- `validate(payload)` method:
    - Extracts `sub` (userId) from payload.
    - Calls `UserService.findByIdWithSecrets(sub)` (needs `passwordChangedAt` for the token-revocation check below).
    - If user not found: throw `UnauthorizedException` with code `TOKEN_INVALID`.
    - If user not active: throw `UnauthorizedException` with code `ACCOUNT_DISABLED`.
    - If user is locked and `lockedUntil` is in the future: throw `UnauthorizedException` with code `ACCOUNT_LOCKED`.
    - If `passwordChangedAt` is after the token's `iat`: throw `UnauthorizedException` with code `TOKEN_REVOKED` (password change invalidates all tokens).
    - Returns the safe user (stripped via UserMapper.toSafe) to be attached to `req.user`.

### 15.3 — DTOs

Every DTO uses `class-validator` decorators. Every field validated. No `any` types.

**`register.dto.ts`**:
- `email` — `@IsEmail()`, `@Transform` to lowercase and trim, max 255.
- `password` — `@IsString()`, `@MinLength(12)`, `@MaxLength(128)`. No complexity rules (NIST 800-63B: length matters, complexity rules don't). The 128 max prevents DoS via hashing extremely long inputs.
- `firstName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.
- `lastName` — `@IsOptional()`, `@IsString()`, `@MaxLength(100)`, `@Transform` to trim.

**`login.dto.ts`**:
- `email` — `@IsEmail()`, `@Transform` to lowercase and trim.
- `password` — `@IsString()`, `@MinLength(1)` (don't leak password length requirements at login).
- `mfaCode` — `@IsOptional()`, `@IsString()`, `@Length(6, 6)`, numeric only. Provided on second step if MFA is enabled.

**`refresh-token.dto.ts`**:
- `refreshToken` — `@IsString()`, `@MinLength(64)`, `@MaxLength(128)`.

**`forgot-password.dto.ts`**:
- `email` — `@IsEmail()`, `@Transform` to lowercase and trim.

**`reset-password.dto.ts`**:
- `token` — `@IsString()`, `@MinLength(64)`.
- `newPassword` — `@IsString()`, `@MinLength(12)`, `@MaxLength(128)`.

**`change-password.dto.ts`**:
- `currentPassword` — `@IsString()`.
- `newPassword` — `@IsString()`, `@MinLength(12)`, `@MaxLength(128)`.

**`verify-email.dto.ts`**:
- `token` — `@IsString()`, `@MinLength(64)`.

**`enable-mfa.dto.ts`** (step 2 — verify the TOTP code to confirm setup):
- `code` — `@IsString()`, `@Length(6, 6)`.

**`verify-mfa.dto.ts`**:
- `code` — `@IsString()`, `@Length(6, 6)`.

**`disable-mfa.dto.ts`**:
- `password` — `@IsString()` (re-authenticate to disable MFA).
- `code` — `@IsString()`, `@Length(6, 6)` (require current MFA code to disable).

**`revoke-session.dto.ts`**:
- `sessionId` — `@IsUUID()`.

**`auth-response.dto.ts`**:
- `accessToken` — string.
- `refreshToken` — string (only for desktop clients; web clients receive it as HttpOnly cookie).
- `expiresIn` — number (seconds until access token expires).
- `tokenType` — always `'Bearer'`.
- `user` — object with `id`, `email`, `firstName`, `lastName`, `roles`, `emailVerified`, `mfaEnabled`.

### 15.4 — Interfaces

**`jwt-payload.interface.ts`**:
```
{
  sub: string              // userId
  email: string
  roles: string[]          // role names (for display/debug only, NOT for auth decisions)
  permissions: string[]    // effective permission codes (the primary auth primitive)
  tenantId: string | null
  iat: number              // issued at (epoch seconds)
  exp: number              // expires at (epoch seconds)
  iss: string              // issuer
  aud: string              // audience
  jti: string              // unique token ID (UUID, enables revocation)
}
```

`roles` is retained for observability (logs, audit trail, client-side UI hints) but guards never read it. Every authorization decision uses `permissions`. This prevents drift: the server-side role→permission mapping is the only source of truth, and rewriting a role's bundle doesn't require every endpoint to be updated.

Token size watch: the flattened permission set for the `admin` role is ~15 codes today. Monitor JWT byte length in metrics (`jwt_size_bytes` histogram) — if it approaches 4 KB (nginx default header buffer), switch to short codes or compact encoding.

**`token-pair.interface.ts`**:
```
{
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

### 15.5 — Password Service (`password.service.ts`)

- `hash(password: string): Promise<string>` — hashes with Argon2id using config values (memory, time, parallelism).
- `verify(password: string, hash: string): Promise<boolean>` — verifies password against Argon2id hash.
- `checkBreached(password: string): Promise<boolean>` — checks against HaveIBeenPwned Passwords API using k-anonymity (only first 5 chars of SHA-1 hash sent to API). Returns true if password is in a known breach. This is a best-effort check — if the API is unreachable, allow the password (don't block registration because an external service is down). Cache results in Redis for 24 hours to reduce API calls.
- `validateStrength(password: string): { valid: boolean, reason?: string }` — checks minimum length (12), maximum length (128). No complexity rules. Returns reason if invalid.

### 15.6 — Token Service (`token.service.ts`)

- `generateAccessToken(user: User): Promise<string>` — creates JWT with RS256 using `@nestjs/jwt`. Builds the payload by calling `flattenRoles(user.roles)` (from 2.6) to produce the effective permission set. Payload includes `sub`, `email`, `roles`, `permissions`, `tenantId`, `jti` (random UUID). TTL from config (15 minutes). Signs with `JWT_PRIVATE_KEY`. Records `jwt_size_bytes` on a Prometheus histogram after signing.
    - **CRITICAL**: In NA (replica region), this service does NOT have the private key. It must call the EU internal endpoint to sign tokens. The token service checks `regionConfig.isPrimary`. If false, it makes an HTTP POST to `PRIMARY_API_URL/internal/tokens/sign` with `INTERNAL_API_SECRET` auth header and the already-flattened payload (EU does not re-resolve roles — NA resolves them against its own `ROLE_PERMISSIONS` constant so both regions must deploy with identical role maps). Returns the signed token from EU.
- `generateRefreshToken(): string` — generates 64 random bytes as hex string. This is an opaque token, not a JWT.
- `verifyAccessToken(token: string): Promise<JwtPayload>` — verifies JWT with public key. Returns decoded payload. Throws on invalid/expired.
- `decodeWithoutVerification(token: string): JwtPayload | null` — decodes JWT without verification. Used only for extracting `jti` from expired tokens during refresh flow.

### 15.7 — Session Service (`session.service.ts`)

Manages user sessions in Redis:

- `create(userId: string, deviceInfo: string, ipHash: string): Promise<{ sessionId: string, refreshToken: string }>`:
    - Generates session ID (UUID v7).
    - Generates refresh token (64 random bytes, hex).
    - Creates a `RefreshTokenFamily` record in PRISMA_WRITE with: userId, SHA-256 hash of refresh token, region, device info, IP hash, expires at (30 days).
    - Stores session metadata in Redis at `as:{region}:sessions:{userId}:{sessionId}` with TTL 30 days. Metadata: `{ deviceInfo, ipHash, createdAt, lastActiveAt }`.
    - Returns session ID and raw refresh token.

- `refresh(rawRefreshToken: string): Promise<TokenPair>`:
    - Hash the incoming refresh token with SHA-256.
    - Look up the `RefreshTokenFamily` in PRISMA_READ by `currentTokenHash`.
    - If not found: the token is invalid. Could be reuse of a rotated token. Log to audit. Throw `UnauthorizedException` with code `TOKEN_INVALID`.
    - If found but `isRevoked`: throw `UnauthorizedException` with code `TOKEN_REVOKED`.
    - If found but expired: throw `UnauthorizedException` with code `TOKEN_EXPIRED`.
    - **Reuse detection**: If the incoming token hash does NOT match `currentTokenHash` but DOES match a previously used token hash (track this — or simpler: if the family is found but `currentTokenHash` doesn't match, it means an old token was used):
        - Revoke the entire family immediately (set `isRevoked: true`, `revokedReason: 'token_reuse_detected'`).
        - Delete all sessions for this user in Redis (nuclear option — force re-login on all devices).
        - Log to audit with action `auth.token.reuse_detected`.
        - Capture to Sentry as a security alert.
        - Track in PostHog.
        - Throw `UnauthorizedException` with code `REFRESH_TOKEN_REUSED`.
    - If valid: generate new refresh token. Update `RefreshTokenFamily.currentTokenHash` to the new token's hash. Update `lastUsedAt`. Generate new access token. Return both.

- `revoke(sessionId: string, userId: string): Promise<void>`:
    - Delete session from Redis.
    - Find and revoke the corresponding `RefreshTokenFamily`.
    - Log to audit.

- `revokeAll(userId: string): Promise<void>`:
    - Scan Redis for all sessions of this user (`as:{region}:sessions:{userId}:*`) and delete them.
    - Revoke all `RefreshTokenFamily` records for this user in PRISMA_WRITE.
    - Log to audit.

- `revokeAllExcept(userId: string, keepSessionId: string): Promise<void>`:
    - Scan Redis for all sessions of this user and delete every one except `keepSessionId`.
    - Revoke all `RefreshTokenFamily` records for this user except the one matching the current refresh token hash (looked up from session metadata).
    - Used by Change Password flow to keep the current session active while signing out everywhere else.
    - Log to audit.

- `listSessions(userId: string): Promise<SessionInfo[]>`:
    - Scan Redis for all sessions of this user.
    - Return array of `{ sessionId, deviceInfo, ipHash, createdAt, lastActiveAt, isCurrent }`.

- `updateLastActive(userId: string, sessionId: string): Promise<void>`:
    - Update `lastActiveAt` in Redis session metadata.
    - Called on every authenticated request (debounced — only update if last update was >5 minutes ago to reduce Redis writes).

### 15.8 — MFA Service (`mfa.service.ts`)

Implements TOTP-based MFA using `otplib`. Injects: `UserService`, `CryptoService`, `RedisService`, `AuditService`.

- `generateSetup(userId: string, userEmail: string): Promise<{ secret: string, qrCodeUrl: string, recoveryCodes: string[] }>`:
    - Generate random TOTP secret using `authenticator.generateSecret()`.
    - Store temporarily in Redis at `as:{region}:mfa:setup:{userId}` with TTL 10 minutes.
    - Generate otpauth URI with issuer `AllServices` and user's email as account name.
    - Generate QR code data URL from the URI using `qrcode` library.
    - Generate 10 recovery codes (8 alphanumeric chars each, uppercase).
    - Return secret, QR code data URL, and recovery codes.
    - Do NOT save to user record yet — wait for verification.

- `verifySetup(userId: string, code: string): Promise<boolean>`:
    - Retrieve temporary secret from Redis.
    - If not found: throw `BadRequestException` — setup expired, start over.
    - Verify the TOTP code against the secret.
    - If valid: encrypt the secret via CryptoService. Hash each recovery code with SHA-256. Persist via `UserService.setMfaSecret(userId, encryptedSecret, hashedRecoveryCodes)`. Delete temporary secret from Redis. Return true.
    - If invalid: return false, let user try again (setup token is still valid for 10 min).

- `verifyCode(userId: string, code: string): Promise<boolean>`:
    - Load user via `UserService.findByIdWithSecrets(userId)`.
    - Decrypt `mfaSecret` via CryptoService.
    - Verify TOTP code with a time window of 1 step (30 seconds before and after).
    - If valid: return true.
    - If invalid: hash the provided code with SHA-256, then constant-time compare against each entry in `mfaRecoveryCodes`. If a recovery code matches: call `UserService.consumeRecoveryCode(userId, hashedCode)` to remove it, return true.
    - If neither: return false.

- `disable(userId: string): Promise<void>`:
    - Call `UserService.clearMfa(userId)` (sets mfaEnabled false, clears secret and recovery codes).
    - Log to audit: `auth.mfa.disabled`.

### 15.9 — Auth Service (`auth.service.ts`)

Orchestrates all auth flows. Injects: UserService, PasswordService, TokenService, SessionService, MfaService, AuditService, PostHogService, RedisService, RegionConfig. Does NOT inject PRISMA_READ/PRISMA_WRITE — all user persistence goes through UserService.

**Register**:
1. Validate password strength via PasswordService.
2. Check password against breached passwords list.
3. Check if email already exists via `UserService.existsByEmail(email)`.
4. If exists: throw `ConflictException` with code `EMAIL_ALREADY_EXISTS`.
5. Hash password with Argon2id.
6. Create user via `UserService.create({ email, passwordHash, firstName, lastName, emailVerified: false })`.
7. Generate email verification token (64 random bytes, hex). Store in Redis at `as:{region}:verify:{token}` with value `userId`, TTL 24 hours.
8. Queue verification email via mail queue.
9. Create session (generates refresh token).
10. Generate access token.
11. Log to audit: `auth.register`.
12. Track in PostHog: `user_registered`.
13. Return auth response (tokens + user info).
14. Note: user can log in immediately but some features may require email verification.

**Login**:
1. Load user via `UserService.findByEmailWithSecrets(email)`.
2. If not found: DO NOT reveal this. Wait a realistic delay (simulate Argon2 hash time: ~200ms) then throw `UnauthorizedException` with code `INVALID_CREDENTIALS`. This prevents user enumeration via timing.
3. If user is locked and `lockedUntil` is in the future: throw `UnauthorizedException` with code `ACCOUNT_LOCKED`. Include `lockedUntil` in error detail.
4. If user is not active: throw `UnauthorizedException` with code `ACCOUNT_DISABLED`.
5. Verify password against hash.
6. If password wrong:
   a. Increment failed counter via `UserService.incrementFailedLoginAttempts(userId)` — returns new count.
   b. Increment login attempt counter in Redis (for progressive delay).
   c. If attempts >= 5: call `UserService.lock(userId, 'too_many_failed_attempts', now + 15 minutes, null)`. Queue account locked email.
   d. Log to audit: `auth.login.failed` with reason `invalid_password`.
   e. Track in PostHog: `login_failed`.
   f. Throw `UnauthorizedException` with code `INVALID_CREDENTIALS`. Same error as user-not-found (don't reveal which part was wrong).
7. If password correct:
   a. Check if MFA is enabled.
   b. If MFA enabled and `mfaCode` not provided: return `{ mfaRequired: true }` with HTTP 200 (not an error). Client shows MFA input. Use a short-lived MFA session token in Redis (TTL 5 minutes) so the user doesn't have to re-enter password.
   c. If MFA enabled and `mfaCode` provided: verify MFA code. If invalid: throw `UnauthorizedException` with code `MFA_INVALID`.
   d. Call `UserService.recordLoginSuccess(userId, ipHash)` — resets failed attempts, clears lock, updates lastLoginAt/lastLoginIp.
   e. Create session.
   f. Generate access token.
   g. Log to audit: `auth.login`.
   h. Track in PostHog: `user_logged_in`.
   i. Return auth response.

**Token delivery**:
- For web clients (`X-Client-Platform: web`): set refresh token as `__Host-session` cookie. `HttpOnly: true`, `Secure: true`, `SameSite: Strict`, `Path: /`, max-age from config. Do NOT include refresh token in response body.
- For desktop clients (`X-Client-Platform: desktop` or no header): include refresh token in response body.

**Refresh**:
1. Call SessionService.refresh() with the raw refresh token.
2. If from cookie: read from `__Host-session` cookie.
3. If from body: read from `refreshToken` field.
4. On success: return new token pair. For web: set new cookie. For desktop: return in body.
5. Log to audit: `auth.token.refresh`.

**Logout**:
1. Revoke the current session via SessionService.
2. For web: clear the `__Host-session` cookie.
3. Log to audit: `auth.logout`.
4. Return `{ success: true }`.

**Logout All Devices**:
1. Revoke all sessions via SessionService.revokeAll().
2. For web: clear the `__Host-session` cookie.
3. Log to audit: `auth.logout.all`.
4. Return `{ success: true }`.

**Verify Email**:
1. Look up token in Redis at `as:{region}:verify:{token}`.
2. If not found: throw `BadRequestException` with code `VERIFICATION_TOKEN_INVALID`.
3. Retrieve userId from Redis value.
4. Call `UserService.markEmailVerified(userId)`.
5. Delete token from Redis.
6. Log to audit: `auth.email.verify`.
7. Return `{ success: true }`.

**Forgot Password**:
1. Load user via `UserService.findByEmail(email)`.
2. If not found: DO NOT reveal this. Return success response regardless (prevent user enumeration).
3. If found: generate reset token (64 random bytes, hex). Store in Redis at `as:{region}:reset:{token}` with value `userId`, TTL 1 hour.
4. Queue password reset email.
5. Log to audit: `auth.password.reset.request` (even if user not found — log the attempt).
6. Return `{ success: true, message: 'If an account exists with this email, a reset link has been sent.' }`.

**Reset Password**:
1. Look up token in Redis at `as:{region}:reset:{token}`.
2. If not found: throw `BadRequestException` with code `RESET_TOKEN_INVALID`.
3. Validate new password strength.
4. Check new password against breached list.
5. Hash new password.
6. Call `UserService.updatePassword(userId, passwordHash)` (sets passwordHash + passwordChangedAt).
7. Call `SessionService.revokeAll(userId)` to force re-login everywhere.
8. Delete reset token from Redis.
9. Log to audit: `auth.password.reset`.
10. Return `{ success: true }`.

**Change Password** (authenticated):
1. Load `UserService.findByIdWithSecrets(userId)` to get current `passwordHash`.
2. Verify current password against hash via PasswordService.
3. If wrong: throw `UnauthorizedException` with code `INVALID_CREDENTIALS`.
4. Validate new password strength.
5. Check new password against breached list.
6. Hash new password.
7. Call `UserService.updatePassword(userId, passwordHash)`.
8. Call `SessionService.revokeAllExcept(userId, currentSessionId)` — keep current session active.
9. Log to audit: `auth.password.change`.
10. Track in PostHog: `password_changed`.
11. Return `{ success: true }`.

**MFA Setup** (authenticated):
1. Call `MfaService.generateSetup(userId, userEmail)` (email comes from `req.user`).
2. Return `{ secret, qrCodeUrl, recoveryCodes }`.
3. Instruct client to show QR code and backup codes.

**MFA Verify Setup** (authenticated):
1. Call `MfaService.verifySetup(userId, code)`.
2. If valid: log to audit `auth.mfa.enable`. Track in PostHog `mfa_enabled`. Return `{ success: true }`.
3. If invalid: return `{ success: false, message: 'Invalid code, try again.' }`.

**MFA Disable** (authenticated):
1. Load `UserService.findByIdWithSecrets(userId)` for password verification.
2. Verify password (re-authenticate) via PasswordService.
3. Verify current MFA code via `MfaService.verifyCode(userId, code)`.
4. Call `MfaService.disable(userId)`.
5. Log to audit: `auth.mfa.disable`.
6. Track in PostHog: `mfa_disabled`.
7. Return `{ success: true }`.

**List Sessions** (authenticated):
1. Call SessionService.listSessions().
2. Return array with current session marked.

**Revoke Session** (authenticated):
1. Call SessionService.revoke() with sessionId and userId.
2. Verify the session belongs to the requesting user (prevent revoking others' sessions).
3. Return `{ success: true }`.

### 15.10 — Auth Controller (`auth.controller.ts`)

All routes under `/v1/auth`.

```
POST   /v1/auth/register           @Public()  @RateLimit(3, 60)    @WriteOperation()
POST   /v1/auth/login               @Public()  @RateLimit(5, 60)    @WriteOperation()
POST   /v1/auth/refresh             @Public()  @RateLimit(10, 60)   @WriteOperation()
POST   /v1/auth/logout              (auth required)                  @WriteOperation()
POST   /v1/auth/logout-all          (auth required)                  @WriteOperation()
POST   /v1/auth/verify-email        @Public()  @RateLimit(5, 60)    @WriteOperation()
POST   /v1/auth/forgot-password     @Public()  @RateLimit(3, 3600)  @WriteOperation()
POST   /v1/auth/reset-password      @Public()  @RateLimit(3, 3600)  @WriteOperation()
POST   /v1/auth/change-password     (auth required)                  @WriteOperation()
GET    /v1/auth/sessions            (auth required)
DELETE /v1/auth/sessions/:id        (auth required)                  @WriteOperation()
POST   /v1/auth/mfa/setup           (auth required)                  @WriteOperation()
POST   /v1/auth/mfa/verify-setup    (auth required)                  @WriteOperation()
POST   /v1/auth/mfa/disable         (auth required)                  @WriteOperation()
GET    /v1/auth/me                  (auth required)
```

`GET /v1/auth/me` returns the current user's profile by calling `UserService.findByIdOrFail(req.user.id)` and mapping through `UserMapper.toResponse`. Equivalent to `GET /v1/users/me` on the User module — retained as a convenience alias on the auth namespace so clients can fetch the current identity without switching base paths.

Every controller method:
- Has explicit return type.
- Uses DTOs for request bodies.
- Uses ParseUUIDPipe for ID parameters.
- Has `@ApiOperation()` and `@ApiResponse()` decorators for Swagger.
- Is thin — delegates to AuthService immediately.

### 15.11 — Internal Token Signing Endpoint

A separate controller NOT under `/v1/`:

```
POST   /internal/tokens/sign
```

This endpoint:
- Is NOT decorated with `@Public()` — but it uses its own guard that checks `INTERNAL_API_SECRET` header instead of JWT.
- Only exists on the EU primary (conditionally registered based on `regionConfig.isPrimary`).
- Accepts: `{ sub, email, roles, permissions, tenantId }` — NA has already flattened roles to permissions using its local `ROLE_PERMISSIONS` constant. EU signs exactly what NA sent; it does NOT re-resolve. This keeps EU and NA in lockstep via deploy, not via runtime coordination.
- Validates the incoming payload: every permission code must exist in EU's `Permission` constant (reject unknown codes with 400). Every role must exist in EU's `Role` constant.
- Returns: `{ accessToken }`.
- Rate limited: 1000 req/min.
- IP restricted: only accepts requests from known NA server IPs (configured via env var or hardcoded).

### 15.12 — Auth Module Registration

The auth module:
- Imports: DatabaseModule, RedisModule, JwtModule (configured async with region-aware key loading), PassportModule, CryptoModule, AuditModule, MailModule, QueueModule, ObservabilityModule, forwardRef(() => UserModule), EventEmitterModule.
- Provides: AuthService, TokenService, PasswordService, MfaService, SessionService, JwtStrategy, UserEventsListener.
- Controllers: AuthController, InternalTokenController (conditional).
- Exports: AuthService, TokenService, PasswordService (UserModule uses PasswordService in `adminCreate`).

`UserEventsListener` subscribes to UserService events:
- On `user.deactivated`, `user.deleted`, `user.locked` → call `SessionService.revokeAll(userId)` so the affected user is forced out of every active session.
- On `user.roles.changed` → log to audit (`auth.roles.propagated`) and no-op on sessions (role changes take effect on next access-token refresh via JWT strategy).

JwtModule configuration:
- `signOptions.algorithm: 'RS256'`.
- `signOptions.expiresIn` from config.
- `signOptions.issuer` from config.
- `signOptions.audience` from config.
- `privateKey`: from config (only present on primary).
- `publicKey`: from config (present on all regions).

---

## Phase 16: Docker

### 16.1 — Dockerfile

Multi-stage build:
- Stage 1 (builder): Node 22 Alpine, install deps with frozen lockfile, copy source, build, prune to prod deps.
- Stage 2 (runtime): Node 22 Alpine, create non-root user (uid 1001), copy dist + node_modules + package.json + ecosystem.config.js from builder. Set user. Expose 3000. Health check via wget to /v1/health. CMD: `npx pm2-runtime ecosystem.config.js`.

`.dockerignore`: node_modules, .git, .env*, coverage, test, .husky, .vscode, *.md (except README).

### 16.2 — Docker Compose (Local Dev)

Services:
- `api-eu` — builds from Dockerfile, port 3000, env: REGION=eu, REGION_ROLE=primary. Depends on postgres, redis-eu.
- `api-na` — builds from Dockerfile, port 3001, env: REGION=na, REGION_ROLE=replica, PRIMARY_API_URL=http://api-eu:3000. Depends on postgres, redis-na, api-eu.
- `postgres` — PostgreSQL 16 Alpine, port 5432, volume for data persistence, healthcheck via pg_isready. Config flags: wal_level=replica, max_connections=200, shared_buffers=256MB, log_min_duration_statement=100.
- `redis-eu` — Redis 7 Alpine, port 6379, password, maxmemory 256mb, allkeys-lru eviction.
- `redis-na` — Redis 7 Alpine, port 6380, password, maxmemory 128mb, allkeys-lru eviction.

### 16.3 — PM2 Ecosystem Config

```js
module.exports = {
  apps: [{
    name: 'allservices-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    kill_timeout: 30000,
    listen_timeout: 10000,
    wait_ready: true,
    max_restarts: 10,
    restart_delay: 1000,
    error_file: '/dev/null',
    out_file: '/dev/null',
    merge_logs: true,
  }],
};
```

---

## Phase 17: CI/CD

### 17.1 — GitHub Actions Workflow

Quality job (every push/PR):
1. Checkout.
2. Setup pnpm.
3. Setup Node 22 with cache.
4. Install deps (frozen lockfile).
5. Lint.
6. Type check (`tsc --noEmit`).
7. Test with coverage.
8. Audit (`pnpm audit --audit-level=high`).
9. Secret scan (`npx gitleaks detect`).
10. Build.

Docker job (after quality passes):
1. Build Docker image tagged with commit SHA.
2. Scan with Trivy.

Deploy EU job (on merge to main, after docker):
1. Deploy to KVM4-EU (SSH or Coolify webhook).
2. Wait 10 seconds.
3. Verify health: `curl -f https://api.eu.production.allservices.cc/v1/health/ready`.

Deploy NA job (after EU deploy succeeds):
1. Deploy to KVM4-NA.
2. Wait 10 seconds.
3. Verify health: `curl -f https://api.na.production.allservices.cc/v1/health/ready`.

Post-deploy job (after both deploys):
1. Upload Sentry source maps.
2. Tag Sentry release.
3. Run smoke tests against production (hit /v1/health, /v1/auth/register with invalid data to verify 422, etc.).

---

## Phase 18: Server Setup

### 18.1 — All Servers (KVM4-EU, KVM4-NA, KV2-EU)

SSH hardening:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
```

Firewall (ufw):
```
ufw default deny incoming
ufw default allow outgoing
ufw allow from <your-ip>/32 to any port 22
ufw enable
```

Fail2ban:
```
apt install fail2ban
```
Configure for SSH brute force protection.

Auto security updates:
```
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Disable unnecessary services:
```
systemctl disable cups avahi-daemon bluetooth
```

Install Docker and Docker Compose.

### 18.2 — KVM4-EU (Frankfurt)

Additional firewall rules:
```
ufw allow from <cloudflare-ip-ranges> to any port 3000
```
(Add all Cloudflare IP ranges from https://www.cloudflare.com/ips/)

Install and configure Cloudflare Tunnel:
```yaml
tunnel: <eu-tunnel-id>
credentials-file: /etc/cloudflare/<eu-tunnel-id>.json
ingress:
  - hostname: api.eu.production.allservices.cc
    service: http://localhost:3000
  - hostname: dashboard.allservices.cc
    service: http://localhost:5173
  - service: http_status:404
```

File permissions:
```
chmod 600 /etc/cloudflare/*.json
chmod 600 /home/deploy/.env.production.eu
```

### 18.3 — KVM4-NA (US West)

Additional firewall rules:
```
ufw allow from <cloudflare-ip-ranges> to any port 3000
```

Install PostgreSQL 16 for read replica:
```
apt install postgresql-16
```

Configure as streaming replica of KV2-EU:
1. Create replication user on KV2-EU: `CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure-password';`.
2. Add to KV2-EU pg_hba.conf: `host replication replicator <KVM4-NA-IP>/32 scram-sha-256`.
3. On KVM4-NA: `pg_basebackup -h <KV2-EU-IP> -U replicator -D /var/lib/postgresql/16/main -P -R`.
4. The `-R` flag creates `standby.signal` and configures `primary_conninfo` in `postgresql.auto.conf`.
5. Start PostgreSQL on KVM4-NA. It begins streaming WAL from KV2-EU.
6. Verify: `SELECT pg_is_in_recovery();` returns `true`.

Configure replica PostgreSQL:
```
hot_standby = on
hot_standby_feedback = on
```

Firewall for PostgreSQL (local only):
```
ufw deny 5432
```
No external access to NA's PostgreSQL. Only localhost (the API on the same machine).

pg_hba.conf on KVM4-NA:
```
host allservices allservices 127.0.0.1/32 scram-sha-256
```

Install and configure Cloudflare Tunnel:
```yaml
tunnel: <na-tunnel-id>
credentials-file: /etc/cloudflare/<na-tunnel-id>.json
ingress:
  - hostname: api.na.production.allservices.cc
    service: http://localhost:3000
  - service: http_status:404
```

### 18.4 — KV2-EU (Germany — Database Server)

Install PostgreSQL 16:
```
apt install postgresql-16
```

Configure as primary:
```
wal_level = replica
max_wal_senders = 5
max_replication_slots = 5
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_min_protocol_version = 'TLSv1.2'
log_connections = on
log_disconnections = on
log_min_duration_statement = 100
shared_preload_libraries = 'pg_stat_statements'
```

pg_hba.conf:
```
host allservices allservices <KVM4-EU-IP>/32 scram-sha-256
host replication replicator <KVM4-NA-IP>/32 scram-sha-256
```

Firewall:
```
ufw deny 5432
ufw allow from <KVM4-EU-IP>/32 to any port 5432
ufw allow from <KVM4-NA-IP>/32 to any port 5432
ufw allow from <your-ip>/32 to any port 22
```

Install PgBouncer:
```
apt install pgbouncer
```

PgBouncer config:
```
[databases]
allservices = host=127.0.0.1 port=5432 dbname=allservices

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
server_tls_sslmode = require
```

API servers connect to PgBouncer (port 6432), not directly to PostgreSQL (port 5432).

Automated backups:
- `pg_dump` daily at 3am UTC, compressed, stored locally.
- Rotate: keep 7 daily, 4 weekly, 3 monthly.
- Test restore procedure monthly.
- Consider `pg_basebackup` for full binary backups.

Install HashiCorp Vault (optional — can start with env vars and migrate later):
- If installed: store JWT private key, database passwords, INTERNAL_API_SECRET.
- API servers fetch secrets from Vault on startup.

### 18.5 — Cloudflare Configuration

DNS records (proxied through Cloudflare):
```
api.eu.production.allservices.cc → Tunnel → KVM4-EU
api.na.production.allservices.cc → Tunnel → KVM4-NA
dashboard.allservices.cc         → Tunnel → KVM4-EU
allservices.cc                   → Pages or Tunnel
legal.allservices.cc             → Pages or Tunnel
```

Load Balancer (optional — for global `api.allservices.cc` endpoint):
```
Pool EU:
  Origin: api.eu.production.allservices.cc
  Health check: GET /v1/health/ready every 30s
  Regions: Europe, Africa, Middle East

Pool NA:
  Origin: api.na.production.allservices.cc
  Health check: GET /v1/health/ready every 30s
  Regions: North America, South America

Failover: If EU unhealthy → route to NA. If NA unhealthy → route to EU.
```

WAF rules:
```
1. Rate limit: 1000 req/min per IP globally
2. Rate limit: 10 req/min per IP on /v1/auth/*
3. Block: /internal/* from public access
4. OWASP Core Rule Set: enabled
5. Bot protection: challenge mode on /v1/auth/*
6. Browser integrity check: ON
7. Force HTTPS
```

SSL/TLS:
```
Mode: Full (strict)
Minimum TLS version: 1.2
Always use HTTPS: ON
HSTS: enabled, max-age 31536000, includeSubDomains, preload
```

Caching:
```
/v1/* — bypass cache (all API responses are dynamic)
Static assets on dashboard — cache 1 day
```

---

## Phase 19: Pre-Flight Checklist

Every item must pass before considering the foundation complete.

### Project
- [ ] Scaffolded with strict TypeScript, zero errors on `tsc --noEmit`.
- [ ] All path aliases resolve correctly.
- [ ] ESLint passes with zero warnings and zero errors.
- [ ] Prettier formats consistently.
- [ ] Husky pre-commit hook runs lint-staged.
- [ ] Commitlint rejects non-conventional commits.
- [ ] All dependencies installed, `pnpm audit` shows zero high/critical.

### Config
- [ ] App crashes with clear error listing ALL missing env vars when `.env` is empty.
- [ ] App starts successfully with all vars provided.
- [ ] Region config loads correctly for `eu`/`primary` and `na`/`replica`.
- [ ] JWT_PRIVATE_KEY validation only required when REGION_ROLE=primary (tested).

### Security (main.ts)
- [ ] `trust proxy` set. Verified: `req.ip` shows client IP, not Cloudflare's.
- [ ] Helmet headers present (`curl -I`): X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Referrer-Policy, Content-Security-Policy.
- [ ] X-Powered-By header removed.
- [ ] CORS rejects requests from unlisted origins (tested with curl).
- [ ] CORS allows requests from listed origins with credentials (tested).
- [ ] Body size limit rejects payloads over 1MB (tested).
- [ ] Swagger accessible in development, 404 in production.

### Validation
- [ ] Unknown fields in request body rejected with 422 (tested).
- [ ] Missing required fields rejected with 422 listing all failures (tested).
- [ ] Type coercion works (string "123" becomes number 123 where expected).

### Response Format
- [ ] Every successful response wrapped in `{ data, meta }`.
- [ ] `meta` includes `requestId`, `timestamp`, `version`, `region`.
- [ ] Every error response follows error envelope shape.
- [ ] 5xx errors return generic message, full detail in logs only.
- [ ] 4xx errors return specific error code.
- [ ] 422 validation errors include `details` array with field-level errors.
- [ ] `X-Request-Id` header present on every response.
- [ ] `X-Region` header present on every response.

### Logging
- [ ] Pino outputs structured JSON in production.
- [ ] Every log line includes `requestId`, `region`, `regionRole`.
- [ ] Passwords, tokens, and authorization headers redacted in logs.
- [ ] IPs logged only as hashes.
- [ ] Request duration logged.

### Observability
- [ ] Sentry receives test error (verified in Sentry dashboard).
- [ ] Sentry event includes region tag.
- [ ] PostHog receives test event (verified in PostHog dashboard).
- [ ] Prometheus `/metrics` endpoint returns metrics data.

### Database
- [ ] PRISMA_WRITE connects to KV2-EU (tested from EU and NA configs).
- [ ] PRISMA_READ connects to configured read URL (tested).
- [ ] Migrations run successfully (`npx prisma migrate deploy`).
- [ ] Seed script creates admin user in development.
- [ ] Slow query logging enabled (queries >100ms logged).
- [ ] PgBouncer accepts connections from API servers.

### Redis
- [ ] Connects and responds to PING (tested).
- [ ] Key prefix `as:eu:` / `as:na:` applied correctly.
- [ ] TTL enforced on all set operations (tested: set without TTL is impossible via service).
- [ ] Maxmemory and eviction policy configured.

### Rate Limiting
- [ ] Returns 429 when limit exceeded (tested).
- [ ] Uses real client IP behind Cloudflare, not Cloudflare's IP.
- [ ] Counters stored in Redis (tested: shared across PM2 workers).
- [ ] Auth endpoints have stricter limits than general endpoints.

### Health Checks
- [ ] `GET /v1/health` returns 200 with region info.
- [ ] `GET /v1/health/ready` checks DB read, DB write, Redis.
- [ ] Reports `writable: true` when write DB is reachable.
- [ ] Reports `writable: false` when write DB is unreachable (tested by stopping DB).
- [ ] Returns 503 when critical check fails.

### Region Awareness
- [ ] RegionInterceptor attaches region to every request.
- [ ] Write guard returns 503 with `SERVICE_READ_ONLY` when write DB is down (tested).
- [ ] NA reads from local replica successfully (tested).
- [ ] NA writes to EU primary successfully (tested, latency measured and logged).

### Permissions
- [ ] `Permission` constant object defined `as const` in `src/common/constants/permissions.constants.ts` and exports `PermissionCode` derived union type.
- [ ] `ROLE_PERMISSIONS` map is the single source of truth binding each `Role` enum value to a readonly array of `PermissionCode` values.
- [ ] `flattenRoles(roles)` returns the deduplicated union of permissions across all roles and ignores unknown role strings without throwing.
- [ ] `PermissionsGuard` is registered globally in `AppModule` as `APP_GUARD`, runs after `JwtAuthGuard`, and before `RolesGuard`.
- [ ] `PermissionsGuard` allows requests that declare no `@RequirePermission` / `@RequireAnyPermission` metadata (public or role-only routes).
- [ ] `PermissionsGuard` denies with 403 `INSUFFICIENT_PERMISSIONS` when `req.user.permissions` does not include a required permission.
- [ ] `@RequirePermission(...perms)` enforces AND semantics — all listed permissions must be present.
- [ ] `@RequireAnyPermission(...perms)` enforces OR semantics — at least one listed permission must be present.
- [ ] `self`-scope permissions (e.g. `user:read:self`, `user:write:self`) pass the guard only when `req.params.id === req.user.id`; mismatched ID returns 403 `FORBIDDEN_SELF_SCOPE`.
- [ ] `tenant`-scope permissions (e.g. `user:read:tenant`, `user:list:tenant`) pass the guard unconditionally; tenant isolation is enforced in the service layer by filtering on `actor.tenantId`.
- [ ] `any`-scope permissions (e.g. `user:read:any`, `user:list:any`) bypass tenant filtering in the service layer (verified with a cross-tenant test).
- [ ] `JwtPayload.permissions: string[]` is populated at token issuance time via `flattenRoles(user.roles)` (verified by decoding a token).
- [ ] `jwt_size_bytes` metric is emitted for every signed access token and scraped by Prometheus.
- [ ] JWT access-token size stays under 4096 bytes for the largest role bundle (`ADMIN`); breach triggers an alert.
- [ ] `req.user.permissions` is populated from the JWT by `JwtStrategy.validate()` and is always an array (never undefined).
- [ ] Changing a user's roles via `PATCH /v1/users/:id` does NOT update existing tokens — the user must re-login or refresh for new permissions to take effect (documented behaviour).
- [ ] NA-signed tokens contain the same `permissions` array as EU-signed tokens (internal token-signing endpoint does not re-resolve permissions, only validates the payload).
- [ ] Adding a permission to a role in `ROLE_PERMISSIONS` requires only a code change and a service restart (no DB migration).
- [ ] `@Roles()` decorator and `RolesGuard` are kept as a legacy second-line check, documented as deprecated, and do not override `PermissionsGuard` decisions.
- [ ] Unit test: every `PermissionCode` in the `Permission` object appears in at least one role's bundle in `ROLE_PERMISSIONS` (orphan-permission detection).
- [ ] Unit test: `flattenRoles([Role.USER, Role.ADMIN])` returns a deduplicated array with no repeats.
- [ ] Integration test: endpoint guarded by `@RequirePermission(USER_CREATE)` returns 403 for a `USER` role token and 200 for an `ADMIN` role token.
- [ ] Integration test: tenant-admin cannot read users from another tenant even with `user:read:tenant` (service-layer filter verified).

### User Module
- [ ] `GET /v1/users/me` returns current user profile, never exposes `passwordHash`/`mfaSecret`/`mfaRecoveryCodes`.
- [ ] `PATCH /v1/users/me` updates firstName/lastName, rejects empty payload with 422.
- [ ] `GET /v1/users/:id` allows self-access (same userId) and admin access; returns 403 `FORBIDDEN_USER_ACCESS` otherwise.
- [ ] `GET /v1/users` (admin) paginates, filters by role/isActive/isLocked/search/tenantId, honours sort order.
- [ ] `GET /v1/users` (tenant-admin) is scoped to the actor's tenant — cannot view users from other tenants.
- [ ] `POST /v1/users` (admin) creates user, hashes password, rejects duplicate email with 409.
- [ ] `PATCH /v1/users/:id` (admin) updates roles/isActive/tenantId/emailVerified, emits `user.deactivated` event when isActive flips false.
- [ ] `DELETE /v1/users/:id` (admin) soft-deletes (sets deletedAt), emits `user.deleted` event, triggers session revocation via AuthModule listener.
- [ ] `POST /v1/users/:id/restore` (admin) clears deletedAt, reactivates user.
- [ ] `POST /v1/users/:id/lock` (admin) locks user with reason and duration; emits `user.locked` event → sessions revoked.
- [ ] `POST /v1/users/:id/unlock` (admin) clears lock state and resets failedLoginAttempts.
- [ ] UserService.findById filters soft-deleted users by default.
- [ ] UserService.create throws `EMAIL_ALREADY_EXISTS` (409) on duplicate email.
- [ ] UserService.adminUpdate logs audit entry with actor ID and changed-field diff.
- [ ] UserMapper.toResponse never leaks `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`, `lastLoginIp`, `failedLoginAttempts`.
- [ ] `user.created`, `user.deactivated`, `user.deleted`, `user.locked`, `user.roles.changed` events emit on the documented contract and AuthModule consumes them correctly.

### Auth Module
- [ ] Register: creates user via UserService, hashes password with Argon2id, sends verification email, returns tokens.
- [ ] Register: rejects duplicate email with 409.
- [ ] Register: rejects weak password (under 12 chars).
- [ ] Register: rejects breached password (if HaveIBeenPwned API reachable).
- [ ] Login: returns tokens on correct credentials.
- [ ] Login: returns same error for wrong email and wrong password (no user enumeration).
- [ ] Login: takes same time for wrong email and wrong password (constant-time via dummy hash).
- [ ] Login: locks account after 5 failed attempts.
- [ ] Login: locked account returns ACCOUNT_LOCKED with unlock time.
- [ ] Login: MFA flow returns `mfaRequired: true` when MFA enabled but code not provided.
- [ ] Login: MFA flow accepts valid TOTP code.
- [ ] Login: MFA flow rejects invalid TOTP code.
- [ ] Refresh: returns new token pair with valid refresh token.
- [ ] Refresh: rejects expired refresh token.
- [ ] Refresh: detects token reuse and revokes entire family.
- [ ] Refresh: works from cookie (web) and body (desktop).
- [ ] Logout: revokes current session.
- [ ] Logout all: revokes all sessions for user.
- [ ] Verify email: marks email as verified with valid token.
- [ ] Verify email: rejects expired/invalid token.
- [ ] Forgot password: sends reset email (verified email arrives).
- [ ] Forgot password: returns same response for existing and non-existing email.
- [ ] Reset password: changes password with valid token.
- [ ] Reset password: revokes all sessions.
- [ ] Change password: requires current password.
- [ ] Change password: revokes other sessions, keeps current.
- [ ] MFA setup: generates QR code and recovery codes.
- [ ] MFA verify setup: enables MFA after valid code.
- [ ] MFA disable: requires password and current MFA code.
- [ ] Sessions list: shows all active sessions.
- [ ] Session revoke: revokes specific session.
- [ ] Me endpoint: returns current user profile.
- [ ] Web client: refresh token delivered as HttpOnly cookie.
- [ ] Desktop client: refresh token delivered in response body.
- [ ] All auth actions logged to audit table with hash chain integrity.
- [ ] All auth actions tracked in PostHog.

### Token Signing (Multi-Region)
- [ ] EU signs tokens locally with private key.
- [ ] NA calls EU internal endpoint to sign tokens.
- [ ] Internal endpoint rejects requests without valid INTERNAL_API_SECRET.
- [ ] Both regions verify tokens with public key.
- [ ] Token issued in EU is valid in NA (tested).
- [ ] Token issued via NA (signed by EU) is valid in EU (tested).

### Graceful Shutdown
- [ ] SIGTERM triggers drain sequence.
- [ ] Health check returns 503 during drain.
- [ ] In-flight requests complete before shutdown.
- [ ] DB and Redis connections close cleanly.
- [ ] Sentry and PostHog buffers flush.

### Docker
- [ ] Image builds successfully.
- [ ] Image runs as non-root user (uid 1001).
- [ ] Container health check passes.
- [ ] Docker Compose brings up full stack (EU + NA + PG + 2× Redis).
- [ ] Both simulated regions respond correctly.

### PM2
- [ ] Cluster mode uses all CPU cores.
- [ ] `wait_ready` works (tested: slow startup still gets traffic only when ready).
- [ ] Zero dropped requests during graceful reload (tested).

### Servers
- [ ] SSH key-only, root login disabled on all servers.
- [ ] Firewall: only Cloudflare IPs and your SSH IP allowed.
- [ ] Fail2ban active on all servers.
- [ ] PostgreSQL on KV2-EU accepts connections only from KVM4-EU and KVM4-NA.
- [ ] PostgreSQL on KVM4-NA only accepts localhost connections.
- [ ] PostgreSQL SSL enabled on KV2-EU.
- [ ] Replication from KV2-EU to KVM4-NA is streaming and lag is under 1 second.
- [ ] PgBouncer on KV2-EU is working (tested connection via API).
- [ ] Auto security updates enabled.

### Cloudflare
- [ ] Tunnels configured and running for EU and NA.
- [ ] WAF rules active.
- [ ] Rate limiting at edge configured.
- [ ] Health checks polling both regions every 30 seconds.
- [ ] Geo-routing tested: EU user → EU API, NA user → NA API (tested via VPN).
- [ ] `/internal/*` blocked from public access.
- [ ] HTTPS enforced, HTTP redirected.
- [ ] HSTS enabled with preload.

### CI/CD
- [ ] Lint + typecheck + test + build + audit passes in CI.
- [ ] Secret scanning enabled (gitleaks).
- [ ] Docker image builds and scanned (Trivy) in CI.
- [ ] Deploy pipeline: EU first → health verify → NA → health verify.
- [ ] Post-deploy: Sentry source maps uploaded, release tagged.

### Git
- [ ] `.gitignore` covers all generated/sensitive files.
- [ ] `.env.example` lists every variable with descriptions.
- [ ] Main branch protected.
- [ ] All commits follow conventional commit format.

---

## What Comes Next (After This Plan Is Complete)

With this foundation in place, every future module plugs in the same way:
1. Create a folder under `src/modules/{name}/`.
2. Define DTOs with full validation.
3. Define Prisma models, generate migration.
4. Create service with `@Inject('PRISMA_READ')` and `@Inject('PRISMA_WRITE')`.
5. Create controller with proper decorators, guards, and rate limits.
6. Register in `app.module.ts`.
7. Every request is automatically: authenticated, rate-limited, logged, traced, region-tagged, validated, wrapped in the standard response envelope, and auditable.

Next modules in order:
1. Sessions (elevated session management beyond auth).
2. Products (product catalogue).
3. Licenses (activation, validation, HWID binding).
4. Entitlements.
5. Modules (module registry).
6. Loader (encrypted module streaming).
7. Releases (client shell updates).
8. Orders.
9. Subscriptions.
10. Payments (Stripe integration).
11. Tenants.
12. API Keys.
13. Announcements.
