/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Express Request augmentation for request-scoped fields set by global middleware.
 */
export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      realIp: string;
      ipHash: string;
    }
  }
}
