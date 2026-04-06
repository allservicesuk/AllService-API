/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Session info type returned by the sessions list endpoint.
 */

export interface SessionInfo {
  readonly sessionId: string;
  readonly deviceInfo: string | null;
  readonly ipHash: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly isCurrent: boolean;
}
