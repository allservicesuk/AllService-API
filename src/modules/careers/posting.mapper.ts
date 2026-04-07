/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Maps Prisma JobPosting records to PostingResponseDto for API output.
 */
import { Injectable } from '@nestjs/common';
import type { JobPosting } from '@prisma/client';

import type { PostingResponseDto } from './dto/posting-response.dto';

@Injectable()
export class PostingMapper {
  toResponse(posting: JobPosting): PostingResponseDto {
    return {
      id: posting.id,
      title: posting.title,
      slug: posting.slug,
      department: posting.department,
      location: posting.location,
      type: posting.type,
      workMode: posting.workMode,
      description: posting.description,
      requirements: posting.requirements,
      salaryMin: posting.salaryMin,
      salaryMax: posting.salaryMax,
      salaryCurrency: posting.salaryCurrency,
      salaryPeriod: posting.salaryPeriod,
      cvRequired: posting.cvRequired,
      customFields: (posting.customFields as unknown[] | null) ?? null,
      status: posting.status,
      closesAt: posting.closesAt?.toISOString() ?? null,
      publishedAt: posting.publishedAt?.toISOString() ?? null,
      createdAt: posting.createdAt.toISOString(),
      updatedAt: posting.updatedAt.toISOString(),
    };
  }

  toResponseList(postings: readonly JobPosting[]): PostingResponseDto[] {
    return postings.map((p) => this.toResponse(p));
  }
}
