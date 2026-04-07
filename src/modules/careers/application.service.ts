/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Core application service handling submission, verification, status pipeline, withdrawal, and analytics.
 */
import { createHash } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Application, ApplicationStatus, Prisma, PrismaClient } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import careersConfig from '@config/careers.config';
import regionConfig from '@config/region.config';

import type { CustomFieldDefinition } from './interfaces/custom-field.interface';

import { PRISMA_READ } from '../../database/database.tokens';
import { PRISMA_WRITE } from '../../database/database.tokens';

import { ApplicantTokenService } from './applicant-token.service';
import { CareerFileService } from './career-file.service';
import type { SubmitApplicationDto } from './dto/submit-application.dto';
import type { ListApplicationsDto } from './dto/list-applications.dto';
import type { CareerAnalytics } from './interfaces/career-analytics.interface';
import type { ApplicationDetail } from './interfaces/application-detail.interface';
import { PostingService } from './posting.service';

const TERMINAL_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

const ALLOWED_TRANSITIONS: Record<string, readonly ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWED: ['OFFER_EXTENDED', 'REJECTED', 'WITHDRAWN'],
  OFFER_EXTENDED: ['HIRED', 'REJECTED', 'WITHDRAWN'],
};

const PHONE_STRIP_REGEX = /[^+\d]/g;
const TOP_POSTINGS_LIMIT = 10;
const DRAFT_PRUNE_HOURS = 24;

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    @Inject(careersConfig.KEY) private readonly config: ConfigType<typeof careersConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly postingService: PostingService,
    private readonly tokenService: ApplicantTokenService,
    private readonly fileService: CareerFileService,
    private readonly events: EventEmitter2,
  ) {}

  async submit(
    dto: SubmitApplicationDto,
    ipAddress: string,
    file?: Express.Multer.File,
  ): Promise<{ application: Application; magicLinkUrl: string }> {
    const posting = await this.postingService.findById(dto.jobPostingId);

    if (posting.status !== 'PUBLISHED') {
      throw new BadRequestException({
        code: ErrorCode.POSTING_NOT_PUBLISHED,
        message: 'This posting is not accepting applications',
      });
    }

    if (posting.closesAt && posting.closesAt < new Date()) {
      throw new GoneException({
        code: ErrorCode.POSTING_CLOSED,
        message: 'This posting has closed',
      });
    }

    const verifyResult = await this.tokenService.verifyCode(
      dto.email,
      dto.jobPostingId,
      dto.verificationCode,
    );
    if (!verifyResult.valid) {
      throw new BadRequestException({
        code: ErrorCode.VERIFY_CODE_INVALID,
        message: 'Invalid or expired verification code',
      });
    }

    const existing = await this.prismaRead.application.findUnique({
      where: {
        applicantEmail_jobPostingId: {
          applicantEmail: dto.email,
          jobPostingId: dto.jobPostingId,
        },
      },
    });
    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException({
        code: ErrorCode.APPLICATION_DUPLICATE,
        message: 'You have already applied for this position',
      });
    }

    const customFields = (posting.customFields as CustomFieldDefinition[] | null) ?? [];
    if (customFields.length > 0) {
      this.validateCustomResponses(customFields, dto.customResponses ?? {});
    }

    const ipHash = createHash('sha256').update(ipAddress).digest('hex');
    const phoneNormalized = dto.phone ? dto.phone.replace(PHONE_STRIP_REGEX, '') : null;

    const application = await this.prismaWrite.$transaction(async (tx) => {
      let app: Application;

      if (existing && existing.status === 'DRAFT') {
        app = await tx.application.update({
          where: { id: existing.id },
          data: {
            applicantName: dto.name,
            applicantPhone: dto.phone ?? null,
            phoneNormalized,
            coverLetter: dto.coverLetter ?? null,
            ...(dto.customResponses ? { customResponses: dto.customResponses } : {}),
            status: 'SUBMITTED',
            emailVerified: true,
            ipHash,
          },
        });
      } else {
        app = await tx.application.create({
          data: {
            jobPostingId: dto.jobPostingId,
            applicantName: dto.name,
            applicantEmail: dto.email,
            applicantPhone: dto.phone ?? null,
            phoneNormalized,
            coverLetter: dto.coverLetter ?? null,
            ...(dto.customResponses ? { customResponses: dto.customResponses } : {}),
            status: 'SUBMITTED',
            emailVerified: true,
            ipHash,
          },
        });
      }

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          notes: 'Application submitted',
        },
      });

      if (file) {
        const stored = await this.fileService.saveFile(file);
        await tx.applicationDocument.create({
          data: {
            applicationId: app.id,
            filename: stored.filename,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            storagePath: stored.storagePath,
            sha256Hash: stored.sha256Hash,
          },
        });
      }

      return app;
    });

    const rawToken = await this.tokenService.generateMagicLinkToken(application.id);
    const magicLinkUrl = this.tokenService.buildMagicLinkUrl(rawToken);

    this.events.emit('career.application.submitted', {
      applicationId: application.id,
      applicantName: dto.name,
      applicantEmail: dto.email,
      applicantPhone: dto.phone ?? null,
      coverLetter: dto.coverLetter ?? null,
      customResponses: dto.customResponses ?? null,
      hasCV: !!file,
      jobPostingId: dto.jobPostingId,
      jobTitle: posting.title,
      magicLinkUrl,
    });

    this.logger.log(`career.application.submitted id=${application.id} posting=${posting.slug}`);
    return { application, magicLinkUrl };
  }

  async findByEmailAndPosting(email: string, jobPostingId: string): Promise<Application> {
    const application = await this.prismaRead.application.findUnique({
      where: {
        applicantEmail_jobPostingId: {
          applicantEmail: email,
          jobPostingId,
        },
      },
    });
    if (!application) {
      throw new NotFoundException({
        code: ErrorCode.APPLICATION_NOT_FOUND,
        message: 'Application not found',
      });
    }
    return application;
  }

  async findLatestByEmail(email: string): Promise<Application | null> {
    return this.prismaRead.application.findFirst({
      where: { applicantEmail: email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Application> {
    const application = await this.prismaRead.application.findUnique({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException({
        code: ErrorCode.APPLICATION_NOT_FOUND,
        message: 'Application not found',
      });
    }
    return application;
  }

  async findByIdWithRelations(id: string): Promise<ApplicationDetail> {
    const application = await this.prismaRead.application.findUnique({
      where: { id },
      include: {
        jobPosting: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!application) {
      throw new NotFoundException({
        code: ErrorCode.APPLICATION_NOT_FOUND,
        message: 'Application not found',
      });
    }
    return application as ApplicationDetail;
  }

  async listApplications(
    dto: ListApplicationsDto,
  ): Promise<{ data: Application[]; total: number }> {
    const where: Prisma.ApplicationWhereInput = {};

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.jobPostingId) {
      where.jobPostingId = dto.jobPostingId;
    }

    if (dto.search) {
      where.OR = [
        { applicantName: { contains: dto.search, mode: 'insensitive' } },
        { applicantEmail: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaRead.application.findMany({
        where,
        include: { jobPosting: true, documents: true },
        orderBy: { [dto.sortBy]: dto.sortOrder },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prismaRead.application.count({ where }),
    ]);

    return { data, total };
  }

  async changeStatus(
    id: string,
    newStatus: ApplicationStatus,
    changedBy: string,
    notes?: string,
  ): Promise<Application> {
    const application = await this.findById(id);

    if (TERMINAL_STATUSES.has(application.status)) {
      throw new ConflictException({
        code: ErrorCode.APPLICATION_TERMINAL_STATUS,
        message: `Application is in terminal status ${application.status}`,
      });
    }

    const allowed = ALLOWED_TRANSITIONS[application.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ConflictException({
        code: ErrorCode.APPLICATION_INVALID_TRANSITION,
        message: `Cannot transition from ${application.status} to ${newStatus}`,
      });
    }

    const updated = await this.prismaWrite.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: newStatus,
          notes: notes ?? null,
          changedBy,
        },
      });

      return app;
    });

    const posting = await this.postingService.findById(updated.jobPostingId);

    this.events.emit('career.application.status_changed', {
      applicationId: id,
      applicantName: updated.applicantName,
      applicantEmail: updated.applicantEmail,
      jobTitle: posting.title,
      fromStatus: application.status,
      toStatus: newStatus,
      notes,
    });

    this.logger.log(
      `career.application.status_changed id=${id} from=${application.status} to=${newStatus}`,
    );
    return updated;
  }

  async bulkChangeStatus(
    applicationIds: string[],
    newStatus: ApplicationStatus,
    changedBy: string,
    notes?: string,
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; reason: string }> }> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of applicationIds) {
      try {
        await this.changeStatus(id, newStatus, changedBy, notes);
        succeeded.push(id);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown';
        failed.push({ id, reason });
      }
    }

    this.logger.log(
      `career.application.bulk_status succeeded=${succeeded.length} failed=${failed.length}`,
    );
    return { succeeded, failed };
  }

  async withdraw(id: string): Promise<Application> {
    const application = await this.findById(id);

    if (application.status === 'WITHDRAWN') {
      throw new ConflictException({
        code: ErrorCode.APPLICATION_ALREADY_WITHDRAWN,
        message: 'Application has already been withdrawn',
      });
    }

    if (TERMINAL_STATUSES.has(application.status)) {
      throw new ConflictException({
        code: ErrorCode.APPLICATION_TERMINAL_STATUS,
        message: `Cannot withdraw application in terminal status ${application.status}`,
      });
    }

    const updated = await this.prismaWrite.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: 'WITHDRAWN' },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: 'WITHDRAWN',
          notes: 'Withdrawn by applicant',
        },
      });

      return app;
    });

    this.logger.log(`career.application.withdrawn id=${id}`);
    return updated;
  }

  async getAnalytics(): Promise<CareerAnalytics> {
    const [totalPostings, publishedPostings, totalApplications, statusGroups, topPostings] =
      await Promise.all([
        this.prismaRead.jobPosting.count(),
        this.prismaRead.jobPosting.count({ where: { status: 'PUBLISHED' } }),
        this.prismaRead.application.count(),
        this.prismaRead.application.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        this.prismaRead.application.groupBy({
          by: ['jobPostingId'],
          _count: { jobPostingId: true },
          orderBy: { _count: { jobPostingId: 'desc' } },
          take: TOP_POSTINGS_LIMIT,
        }),
      ]);

    const postingIds = topPostings.map((p) => p.jobPostingId);
    const postings =
      postingIds.length > 0
        ? await this.prismaRead.jobPosting.findMany({
            where: { id: { in: postingIds } },
            select: { id: true, title: true },
          })
        : [];

    const postingMap = new Map(postings.map((p) => [p.id, p.title]));

    return {
      totalPostings,
      publishedPostings,
      totalApplications,
      statusBreakdown: statusGroups.map((g) => ({
        status: g.status,
        count: g._count.status,
      })),
      topPostings: topPostings.map((p) => ({
        postingId: p.jobPostingId,
        title: postingMap.get(p.jobPostingId) ?? 'Unknown',
        applicationCount: p._count.jobPostingId,
      })),
    };
  }

  private validateCustomResponses(
    fields: readonly CustomFieldDefinition[],
    responses: Record<string, string | number | boolean>,
  ): void {
    const errors: string[] = [];

    for (const field of fields) {
      const value = responses[field.id];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`"${field.label}" is required`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'url':
          if (typeof value !== 'string') {
            errors.push(`"${field.label}" must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`"${field.label}" must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`"${field.label}" must be true or false`);
          }
          break;
        case 'select':
          if (typeof value !== 'string') {
            errors.push(`"${field.label}" must be a string`);
          } else if (field.options && !field.options.includes(value)) {
            errors.push(`"${field.label}" must be one of: ${field.options.join(', ')}`);
          }
          break;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.CUSTOM_FIELD_VALIDATION_FAILED,
        message: errors.join('; '),
      });
    }
  }

  async pruneDraftApplications(): Promise<number> {
    const cutoff = new Date(Date.now() - DRAFT_PRUNE_HOURS * 60 * 60 * 1000);
    const result = await this.prismaWrite.application.deleteMany({
      where: {
        status: 'DRAFT',
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}
