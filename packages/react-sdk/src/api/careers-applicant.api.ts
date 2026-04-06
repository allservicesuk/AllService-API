/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Applicant-facing careers API using magic link tokens for authentication.
 */
import type { AllServicesClient } from '../core/http-client';
import type { RequestOptions } from '../core/http-client.types';
import type {
  ApplicationResponse,
  RequestAccessRequest,
  SubmitApplicationRequest,
  VerifyApplicationEmailRequest,
} from '../types/careers-applications';
import type { MessageResponse, SendMessageRequest } from '../types/careers-messages';

const BASE = '/v1/careers/applications';

function magicLinkOptions(token: string, options?: RequestOptions): RequestOptions {
  return {
    ...options,
    skipAuth: true,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

export class CareersApplicantApi {
  constructor(private readonly client: AllServicesClient) {}

  async verifyEmail(
    data: VerifyApplicationEmailRequest,
    options?: RequestOptions,
  ): Promise<{ readonly sent: boolean }> {
    return this.client.request<{ readonly sent: boolean }>(
      'POST',
      `${BASE}/verify-email`,
      { ...options, body: data, skipAuth: true },
    );
  }

  async submitApplication(
    data: SubmitApplicationRequest,
    options?: RequestOptions,
  ): Promise<ApplicationResponse> {
    const formData = new FormData();
    formData.append('jobPostingId', data.jobPostingId);
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('verificationCode', data.verificationCode);

    if (data.phone !== undefined) {
      formData.append('phone', data.phone);
    }
    if (data.coverLetter !== undefined) {
      formData.append('coverLetter', data.coverLetter);
    }
    if (data.customResponses !== undefined) {
      formData.append('customResponses', JSON.stringify(data.customResponses));
    }
    if (data.cv !== undefined) {
      formData.append('cv', data.cv);
    }

    return this.client.uploadWithProgress<ApplicationResponse>(
      'POST',
      BASE,
      formData,
      data.onUploadProgress,
      { ...options, skipAuth: true },
    );
  }

  async requestAccess(
    data: RequestAccessRequest,
    options?: RequestOptions,
  ): Promise<{ readonly sent: boolean }> {
    return this.client.request<{ readonly sent: boolean }>(
      'POST',
      `${BASE}/access`,
      { ...options, body: data, skipAuth: true },
    );
  }

  async getMyApplication(
    token: string,
    options?: RequestOptions,
  ): Promise<ApplicationResponse> {
    return this.client.request<ApplicationResponse>(
      'GET',
      `${BASE}/me`,
      magicLinkOptions(token, options),
    );
  }

  async getMyMessages(
    token: string,
    options?: RequestOptions,
  ): Promise<readonly MessageResponse[]> {
    return this.client.request<readonly MessageResponse[]>(
      'GET',
      `${BASE}/me/messages`,
      magicLinkOptions(token, options),
    );
  }

  async sendMyMessage(
    token: string,
    data: SendMessageRequest,
    options?: RequestOptions,
  ): Promise<MessageResponse> {
    return this.client.request<MessageResponse>(
      'POST',
      `${BASE}/me/messages`,
      { ...magicLinkOptions(token, options), body: data },
    );
  }

  async withdraw(
    token: string,
    options?: RequestOptions,
  ): Promise<ApplicationResponse> {
    return this.client.request<ApplicationResponse>(
      'POST',
      `${BASE}/me/withdraw`,
      magicLinkOptions(token, options),
    );
  }
}
