/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Shape of the decoded JWT payload used by access tokens with RS256 signing and permission claims.
 */
export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly tenantId: string | null;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
  readonly jti: string;
}

export interface JwtSignInput {
  readonly sub: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly tenantId: string | null;
  readonly jti: string;
}
