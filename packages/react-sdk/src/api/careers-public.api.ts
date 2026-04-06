/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Public careers API for browsing published job postings without authentication.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type {
  ListPostingsParams,
  ListPostingsResult,
  PostingResponse,
} from '../types/careers-postings';

const BASE = '/v1/careers/postings';

function toQueryString(params: Record<string, unknown>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

export class CareersPublicApi {
  constructor(private readonly client: AllServicesClient) {}

  async listPostings(
    params: ListPostingsParams = {},
    options?: RequestOptions,
  ): Promise<ListPostingsResult> {
    const qs = toQueryString(params as Record<string, unknown>);
    return this.client.request<ListPostingsResult>('GET', `${BASE}${qs}`, {
      ...options,
      skipAuth: true,
    });
  }

  async getBySlug(
    slug: string,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'GET',
      `${BASE}/${encodeURIComponent(slug)}`,
      { ...options, skipAuth: true },
    );
  }
}
