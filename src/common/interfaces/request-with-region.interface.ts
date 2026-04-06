/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Express Request extension that carries the current region and derived write-capability flags.
 */
import type { Request } from 'express';
import type { RegionCode, RegionRoleCode } from '../constants/regions';

export interface RegionContext {
  readonly region: RegionCode;
  readonly role: RegionRoleCode;
  readonly isWriteCapable: boolean;
  readonly isReadOnly: boolean;
}

export interface RequestWithRegion extends Request {
  region: RegionContext;
}
