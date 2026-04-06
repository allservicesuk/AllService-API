/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Maps Prisma Application records to ApplicationResponseDto for API output.
 */
import { Injectable } from '@nestjs/common';
import type { Application, ApplicationDocument, JobPosting } from '@prisma/client';

import type {
  ApplicationDocumentResponseDto,
  ApplicationResponseDto,
} from './dto/application-response.dto';

type ApplicationWithRelations = Application & {
  readonly jobPosting?: JobPosting;
  readonly documents?: ApplicationDocument[];
};

@Injectable()
export class ApplicationMapper {
  toResponse(application: ApplicationWithRelations): ApplicationResponseDto {
    const response: ApplicationResponseDto = {
      id: application.id,
      jobPostingId: application.jobPostingId,
      applicantName: application.applicantName,
      applicantEmail: application.applicantEmail,
      applicantPhone: application.applicantPhone,
      coverLetter: application.coverLetter,
      customResponses: (application.customResponses as Record<string, unknown> | null) ?? null,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      jobTitle: application.jobPosting?.title ?? null,
      documents: application.documents
        ? application.documents.map((d) => this.toDocumentResponse(d))
        : undefined,
    };
    return response;
  }

  toResponseList(applications: readonly ApplicationWithRelations[]): ApplicationResponseDto[] {
    return applications.map((a) => this.toResponse(a));
  }

  private toDocumentResponse(doc: ApplicationDocument): ApplicationDocumentResponseDto {
    return {
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
