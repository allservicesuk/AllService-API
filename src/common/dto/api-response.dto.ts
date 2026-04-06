/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Standard API response envelope classes used for Swagger documentation and controller return types.
 */
export interface PaginationMeta {
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface ApiMeta {
  readonly requestId: string;
  readonly timestamp: string;
  readonly version: string;
  readonly region: string;
  readonly pagination?: PaginationMeta;
}

export class ApiResponse<T> {
  readonly data!: T;
  readonly meta!: ApiMeta;
}
