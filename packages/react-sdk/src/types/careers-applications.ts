/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Career application request and response types mirroring backend DTOs.
 */
import type { ApplicationStatusValue } from './enums';

export interface ApplicationDocumentResponse {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
}

export interface ApplicationResponse {
  readonly id: string;
  readonly jobPostingId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly applicantPhone: string | null;
  readonly coverLetter: string | null;
  readonly customResponses: Record<string, unknown> | null;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly jobTitle?: string | null | undefined;
  readonly documents?: ApplicationDocumentResponse[] | undefined;
}

export interface VerifyApplicationEmailRequest {
  readonly email: string;
  readonly jobPostingId: string;
}

export interface SubmitApplicationRequest {
  readonly jobPostingId: string;
  readonly name: string;
  readonly email: string;
  readonly verificationCode: string;
  readonly phone?: string;
  readonly coverLetter?: string;
  readonly customResponses?: Record<string, string | number | boolean>;
  readonly cv?: File;
  readonly onUploadProgress?: (percent: number) => void;
}

export interface RequestAccessRequest {
  readonly email: string;
  readonly jobPostingId: string;
}

export interface ChangeStatusRequest {
  readonly status: ApplicationStatusValue;
  readonly notes?: string;
}

export interface BulkChangeStatusRequest {
  readonly applicationIds: readonly string[];
  readonly status: ApplicationStatusValue;
  readonly notes?: string;
}

export interface BulkChangeStatusResult {
  readonly succeeded: readonly string[];
  readonly failed: ReadonlyArray<{ readonly id: string; readonly reason: string }>;
}

export interface ListApplicationsParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: ApplicationStatusValue;
  readonly jobPostingId?: string;
  readonly sortBy?: 'createdAt' | 'applicantName' | 'status';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListApplicationsResult {
  readonly data: readonly ApplicationResponse[];
  readonly total: number;
}
