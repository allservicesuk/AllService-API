/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Public-facing controller for browsing published job postings (no auth required).
 */
import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@common/decorators/public.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { ReadOnlySafe } from '@common/decorators/read-only-safe.decorator';

import type { PostingResponseDto } from './dto/posting-response.dto';
import { ListPostingsDto } from './dto/list-postings.dto';
import { PostingMapper } from './posting.mapper';
import { PostingService } from './posting.service';

const PUBLIC_RATE_LIMIT = 60;
const PUBLIC_RATE_TTL = 60;

@ApiTags('careers')
@Controller({ path: 'careers/postings', version: '1' })
export class PublicPostingsController {
  constructor(
    private readonly postingService: PostingService,
    private readonly postingMapper: PostingMapper,
  ) {}

  @Get()
  @Public()
  @ReadOnlySafe()
  @RateLimit(PUBLIC_RATE_LIMIT, PUBLIC_RATE_TTL)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List published job postings' })
  @ApiResponse({ status: 200, description: 'Published postings' })
  async listPublished(
    @Query() dto: ListPostingsDto,
  ): Promise<{ items: PostingResponseDto[]; total: number; page: number; pageSize: number }> {
    const { data, total } = await this.postingService.listPublished(dto);
    return {
      items: this.postingMapper.toResponseList(data),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  @Get(':slug')
  @Public()
  @ReadOnlySafe()
  @RateLimit(PUBLIC_RATE_LIMIT, PUBLIC_RATE_TTL)
  @ApiOperation({ summary: 'Get a published job posting by slug' })
  @ApiResponse({ status: 200, description: 'Posting detail' })
  async getBySlug(@Param('slug') slug: string): Promise<PostingResponseDto> {
    const posting = await this.postingService.findBySlug(slug);
    return this.postingMapper.toResponse(posting);
  }
}
