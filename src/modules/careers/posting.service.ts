/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * CRUD and lifecycle management for job postings including slug generation and status transitions.
 */
import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { JobPosting, Prisma, PrismaClient } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import regionConfig from '@config/region.config';

import { PRISMA_READ } from '../../database/database.tokens';
import { PRISMA_WRITE } from '../../database/database.tokens';

import type { CreatePostingDto } from './dto/create-posting.dto';
import type { ListPostingsDto } from './dto/list-postings.dto';
import type { UpdatePostingDto } from './dto/update-posting.dto';

const SLUG_MAX_LENGTH = 280;

@Injectable()
export class PostingService {
  private readonly logger = new Logger(PostingService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {}

  async create(dto: CreatePostingDto, createdBy: string): Promise<JobPosting> {
    const slug = await this.generateUniqueSlug(dto.title);
    const posting = await this.prismaWrite.jobPosting.create({
      data: {
        title: dto.title,
        slug,
        department: dto.department,
        location: dto.location,
        type: dto.type,
        workMode: dto.workMode,
        description: dto.description,
        requirements: dto.requirements,
        salaryMin: dto.salaryMin ?? null,
        salaryMax: dto.salaryMax ?? null,
        salaryCurrency: dto.salaryCurrency ?? null,
        cvRequired: dto.cvRequired ?? true,
        ...(dto.customFields
          ? { customFields: JSON.parse(JSON.stringify(dto.customFields)) as object }
          : {}),
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
        createdBy,
      },
    });
    this.logger.log(`career.posting.created id=${posting.id} slug=${slug}`);
    return posting;
  }

  async findById(id: string): Promise<JobPosting> {
    const posting = await this.prismaRead.jobPosting.findUnique({ where: { id } });
    if (!posting) {
      throw new NotFoundException({
        code: ErrorCode.POSTING_NOT_FOUND,
        message: 'Job posting not found',
      });
    }
    return posting;
  }

  async findBySlug(slug: string): Promise<JobPosting> {
    const posting = await this.prismaRead.jobPosting.findUnique({ where: { slug } });
    if (!posting) {
      throw new NotFoundException({
        code: ErrorCode.POSTING_NOT_FOUND,
        message: 'Job posting not found',
      });
    }
    return posting;
  }

  async listPublished(dto: ListPostingsDto): Promise<{ data: JobPosting[]; total: number }> {
    const where: Prisma.JobPostingWhereInput = { status: 'PUBLISHED' };

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { department: { contains: dto.search, mode: 'insensitive' } },
        { location: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.department) {
      where.department = { equals: dto.department, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prismaRead.jobPosting.findMany({
        where,
        orderBy: { [dto.sortBy]: dto.sortOrder },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prismaRead.jobPosting.count({ where }),
    ]);

    return { data, total };
  }

  async listAll(dto: ListPostingsDto): Promise<{ data: JobPosting[]; total: number }> {
    const where: Prisma.JobPostingWhereInput = {};

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { department: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.department) {
      where.department = { equals: dto.department, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prismaRead.jobPosting.findMany({
        where,
        orderBy: { [dto.sortBy]: dto.sortOrder },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prismaRead.jobPosting.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, dto: UpdatePostingDto): Promise<JobPosting> {
    await this.findById(id);

    const data: Prisma.JobPostingUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await this.generateUniqueSlug(dto.title);
    }
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.workMode !== undefined) data.workMode = dto.workMode;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.requirements !== undefined) data.requirements = dto.requirements;
    if (dto.salaryMin !== undefined) data.salaryMin = dto.salaryMin;
    if (dto.salaryMax !== undefined) data.salaryMax = dto.salaryMax;
    if (dto.salaryCurrency !== undefined) data.salaryCurrency = dto.salaryCurrency;
    if (dto.cvRequired !== undefined) data.cvRequired = dto.cvRequired;
    if (dto.customFields !== undefined)
      data.customFields = JSON.parse(JSON.stringify(dto.customFields)) as object;
    if (dto.closesAt !== undefined) data.closesAt = new Date(dto.closesAt);

    const posting = await this.prismaWrite.jobPosting.update({ where: { id }, data });
    this.logger.log(`career.posting.updated id=${id}`);
    return posting;
  }

  async publish(id: string): Promise<JobPosting> {
    const posting = await this.findById(id);
    if (posting.status !== 'DRAFT') {
      throw new ConflictException({
        code: ErrorCode.POSTING_INVALID_TRANSITION,
        message: `Cannot publish posting with status ${posting.status}`,
      });
    }
    const updated = await this.prismaWrite.jobPosting.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    this.logger.log(`career.posting.published id=${id}`);
    return updated;
  }

  async close(id: string): Promise<JobPosting> {
    const posting = await this.findById(id);
    if (posting.status !== 'PUBLISHED') {
      throw new ConflictException({
        code: ErrorCode.POSTING_INVALID_TRANSITION,
        message: `Cannot close posting with status ${posting.status}`,
      });
    }
    const updated = await this.prismaWrite.jobPosting.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    this.logger.log(`career.posting.closed id=${id}`);
    return updated;
  }

  async archive(id: string): Promise<JobPosting> {
    const posting = await this.findById(id);
    if (posting.status !== 'CLOSED') {
      throw new ConflictException({
        code: ErrorCode.POSTING_INVALID_TRANSITION,
        message: `Cannot archive posting with status ${posting.status}`,
      });
    }
    const updated = await this.prismaWrite.jobPosting.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    this.logger.log(`career.posting.archived id=${id}`);
    return updated;
  }

  async closeExpiredPostings(): Promise<number> {
    const result = await this.prismaWrite.jobPosting.updateMany({
      where: {
        status: 'PUBLISHED',
        closesAt: { lt: new Date() },
      },
      data: { status: 'CLOSED' },
    });
    return result.count;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX_LENGTH);

    const existing = await this.prismaRead.jobPosting.findUnique({ where: { slug: base } });
    if (!existing) {
      return base;
    }

    const suffix = Date.now().toString(36);
    return `${base.slice(0, SLUG_MAX_LENGTH - suffix.length - 1)}-${suffix}`;
  }
}
