/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Generic paginated-result envelope returned from list endpoints.
 */
export interface PaginationMeta {
  readonly cursor: string | null;
  readonly hasMore: boolean;
  readonly count: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: PaginationMeta;
}
