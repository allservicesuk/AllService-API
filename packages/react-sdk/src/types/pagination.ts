/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Shared pagination types used across all list endpoints.
 */

export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
}
