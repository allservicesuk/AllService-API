/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Career posting request and response types mirroring backend DTOs.
 */
import type { CustomFieldDefinition } from './custom-fields';
import type {
  JobPostingStatusValue,
  JobPostingTypeValue,
  JobPostingWorkModeValue,
} from './enums';

export interface PostingResponse {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly department: string;
  readonly location: string;
  readonly type: string;
  readonly workMode: string;
  readonly description: string;
  readonly requirements: string;
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly salaryCurrency: string | null;
  readonly cvRequired: boolean;
  readonly customFields: CustomFieldDefinition[] | null;
  readonly status: string;
  readonly closesAt: string | null;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePostingRequest {
  readonly title: string;
  readonly department: string;
  readonly location: string;
  readonly type: JobPostingTypeValue;
  readonly workMode: JobPostingWorkModeValue;
  readonly description: string;
  readonly requirements: string;
  readonly salaryMin?: number;
  readonly salaryMax?: number;
  readonly salaryCurrency?: string;
  readonly closesAt?: string;
  readonly cvRequired?: boolean;
  readonly customFields?: readonly CustomFieldDefinition[];
}

export interface UpdatePostingRequest {
  readonly title?: string;
  readonly department?: string;
  readonly location?: string;
  readonly type?: JobPostingTypeValue;
  readonly workMode?: JobPostingWorkModeValue;
  readonly description?: string;
  readonly requirements?: string;
  readonly salaryMin?: number;
  readonly salaryMax?: number;
  readonly salaryCurrency?: string;
  readonly closesAt?: string;
  readonly cvRequired?: boolean;
  readonly customFields?: readonly CustomFieldDefinition[];
}

export interface ListPostingsParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: JobPostingStatusValue;
  readonly department?: string;
  readonly sortBy?: 'createdAt' | 'title' | 'closesAt' | 'publishedAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListPostingsResult {
  readonly data: readonly PostingResponse[];
  readonly total: number;
}
