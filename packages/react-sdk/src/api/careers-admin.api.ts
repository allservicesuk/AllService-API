/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin careers API for managing postings, applications, messages, documents, and analytics.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type { CareerAnalytics } from '../types/careers-analytics';
import type {
  ApplicationResponse,
  BulkChangeStatusRequest,
  BulkChangeStatusResult,
  ChangeStatusRequest,
  ListApplicationsParams,
  ListApplicationsResult,
} from '../types/careers-applications';
import type { MessageResponse, SendMessageRequest } from '../types/careers-messages';
import type {
  CreatePostingRequest,
  ListPostingsParams,
  ListPostingsResult,
  PostingResponse,
  UpdatePostingRequest,
} from '../types/careers-postings';

const POSTINGS_BASE = '/v1/careers/admin/postings';
const APPLICATIONS_BASE = '/v1/careers/admin/applications';
const ANALYTICS_BASE = '/v1/careers/admin/analytics';

function toQueryString(params: Record<string, unknown>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

export class CareersAdminApi {
  constructor(private readonly client: AllServicesClient) {}

  async createPosting(
    data: CreatePostingRequest,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>('POST', POSTINGS_BASE, {
      ...options,
      body: data,
    });
  }

  async listPostings(
    params: ListPostingsParams = {},
    options?: RequestOptions,
  ): Promise<ListPostingsResult> {
    const qs = toQueryString(params as Record<string, unknown>);
    return this.client.request<ListPostingsResult>(
      'GET',
      `${POSTINGS_BASE}${qs}`,
      options,
    );
  }

  async getPosting(
    id: string,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'GET',
      `${POSTINGS_BASE}/${encodeURIComponent(id)}`,
      options,
    );
  }

  async updatePosting(
    id: string,
    data: UpdatePostingRequest,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'PATCH',
      `${POSTINGS_BASE}/${encodeURIComponent(id)}`,
      { ...options, body: data },
    );
  }

  async publishPosting(
    id: string,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'POST',
      `${POSTINGS_BASE}/${encodeURIComponent(id)}/publish`,
      options,
    );
  }

  async closePosting(
    id: string,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'POST',
      `${POSTINGS_BASE}/${encodeURIComponent(id)}/close`,
      options,
    );
  }

  async archivePosting(
    id: string,
    options?: RequestOptions,
  ): Promise<PostingResponse> {
    return this.client.request<PostingResponse>(
      'POST',
      `${POSTINGS_BASE}/${encodeURIComponent(id)}/archive`,
      options,
    );
  }

  async listApplications(
    params: ListApplicationsParams = {},
    options?: RequestOptions,
  ): Promise<ListApplicationsResult> {
    const qs = toQueryString(params as Record<string, unknown>);
    return this.client.request<ListApplicationsResult>(
      'GET',
      `${APPLICATIONS_BASE}${qs}`,
      options,
    );
  }

  async getApplication(
    id: string,
    options?: RequestOptions,
  ): Promise<ApplicationResponse> {
    return this.client.request<ApplicationResponse>(
      'GET',
      `${APPLICATIONS_BASE}/${encodeURIComponent(id)}`,
      options,
    );
  }

  async changeStatus(
    id: string,
    data: ChangeStatusRequest,
    options?: RequestOptions,
  ): Promise<ApplicationResponse> {
    return this.client.request<ApplicationResponse>(
      'PATCH',
      `${APPLICATIONS_BASE}/${encodeURIComponent(id)}/status`,
      { ...options, body: data },
    );
  }

  async bulkChangeStatus(
    data: BulkChangeStatusRequest,
    options?: RequestOptions,
  ): Promise<BulkChangeStatusResult> {
    return this.client.request<BulkChangeStatusResult>(
      'POST',
      `${APPLICATIONS_BASE}/bulk-status`,
      { ...options, body: data },
    );
  }

  async getMessages(
    applicationId: string,
    options?: RequestOptions,
  ): Promise<readonly MessageResponse[]> {
    return this.client.request<readonly MessageResponse[]>(
      'GET',
      `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}/messages`,
      options,
    );
  }

  async sendMessage(
    applicationId: string,
    data: SendMessageRequest,
    options?: RequestOptions,
  ): Promise<MessageResponse> {
    return this.client.request<MessageResponse>(
      'POST',
      `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}/messages`,
      { ...options, body: data },
    );
  }

  async downloadDocument(
    applicationId: string,
    documentId: string,
    options?: RequestOptions,
  ): Promise<Blob> {
    return this.client.requestBlob(
      'GET',
      `${APPLICATIONS_BASE}/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`,
      options,
    );
  }

  async getAnalytics(options?: RequestOptions): Promise<CareerAnalytics> {
    return this.client.request<CareerAnalytics>('GET', ANALYTICS_BASE, options);
  }
}
