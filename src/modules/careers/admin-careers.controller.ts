/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Admin controller for managing job postings, reviewing applications, messaging, and analytics.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ApplicationStatus } from '@prisma/client';
import type { Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { RequirePermission } from '@common/decorators/permissions.decorator';
import { WriteOperation } from '@common/decorators/write-operation.decorator';
import { ReadOnlySafe } from '@common/decorators/read-only-safe.decorator';
import { Permission } from '@common/constants/permissions';
import type { AuthenticatedUser } from '@common/interfaces/request-with-user.interface';

import { ApplicationMapper } from './application.mapper';
import { ApplicationMessageService } from './application-message.service';
import { ApplicationService } from './application.service';
import { BulkChangeStatusDto } from './dto/bulk-change-status.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreatePostingDto } from './dto/create-posting.dto';
import { ListApplicationsDto } from './dto/list-applications.dto';
import { ListPostingsDto } from './dto/list-postings.dto';
import type { PostingResponseDto } from './dto/posting-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdatePostingDto } from './dto/update-posting.dto';
import type { ApplicationResponseDto } from './dto/application-response.dto';
import { CareerFileService } from './career-file.service';
import { MessageMapper, type MessageResponseDto } from './message.mapper';
import { PostingMapper } from './posting.mapper';
import { PostingService } from './posting.service';
import type { CareerAnalytics } from './interfaces/career-analytics.interface';

@ApiTags('careers-admin')
@ApiBearerAuth()
@Controller({ path: 'careers/admin', version: '1' })
export class AdminCareersController {
  constructor(
    private readonly postingService: PostingService,
    private readonly applicationService: ApplicationService,
    private readonly messageService: ApplicationMessageService,
    private readonly fileService: CareerFileService,
    private readonly postingMapper: PostingMapper,
    private readonly applicationMapper: ApplicationMapper,
    private readonly messageMapper: MessageMapper,
    private readonly events: EventEmitter2,
  ) {}

  @Post('postings')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_POSTING_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Posting created' })
  async createPosting(
    @Body() dto: CreatePostingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostingResponseDto> {
    const posting = await this.postingService.create(dto, user.id);
    return this.postingMapper.toResponse(posting);
  }

  @Get('postings')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_POSTING_READ)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List all job postings' })
  @ApiResponse({ status: 200, description: 'All postings' })
  async listPostings(
    @Query() dto: ListPostingsDto,
  ): Promise<{ items: PostingResponseDto[]; total: number; page: number; pageSize: number }> {
    const { data, total } = await this.postingService.listAll(dto);
    return {
      items: this.postingMapper.toResponseList(data),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  @Get('postings/:id')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_POSTING_READ)
  @ApiOperation({ summary: 'Get a job posting by ID' })
  @ApiResponse({ status: 200, description: 'Posting detail' })
  async getPosting(@Param('id', ParseUUIDPipe) id: string): Promise<PostingResponseDto> {
    const posting = await this.postingService.findById(id);
    return this.postingMapper.toResponse(posting);
  }

  @Patch('postings/:id')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_POSTING_WRITE)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiResponse({ status: 200, description: 'Posting updated' })
  async updatePosting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostingDto,
  ): Promise<PostingResponseDto> {
    const posting = await this.postingService.update(id, dto);
    return this.postingMapper.toResponse(posting);
  }

  @Post('postings/:id/publish')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_POSTING_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft posting' })
  @ApiResponse({ status: 200, description: 'Posting published' })
  async publishPosting(@Param('id', ParseUUIDPipe) id: string): Promise<PostingResponseDto> {
    const posting = await this.postingService.publish(id);
    return this.postingMapper.toResponse(posting);
  }

  @Post('postings/:id/close')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_POSTING_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a published posting' })
  @ApiResponse({ status: 200, description: 'Posting closed' })
  async closePosting(@Param('id', ParseUUIDPipe) id: string): Promise<PostingResponseDto> {
    const posting = await this.postingService.close(id);
    return this.postingMapper.toResponse(posting);
  }

  @Post('postings/:id/archive')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_POSTING_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a closed posting' })
  @ApiResponse({ status: 200, description: 'Posting archived' })
  async archivePosting(@Param('id', ParseUUIDPipe) id: string): Promise<PostingResponseDto> {
    const posting = await this.postingService.archive(id);
    return this.postingMapper.toResponse(posting);
  }

  @Get('applications')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_APPLICATION_READ)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'List all applications' })
  @ApiResponse({ status: 200, description: 'Applications list' })
  async listApplications(@Query() dto: ListApplicationsDto): Promise<{
    items: ApplicationResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { data, total } = await this.applicationService.listApplications(dto);
    return {
      items: this.applicationMapper.toResponseList(data),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  @Get('applications/:id')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_APPLICATION_READ)
  @ApiOperation({ summary: 'Get application detail' })
  @ApiResponse({ status: 200, description: 'Application detail with relations' })
  async getApplication(@Param('id', ParseUUIDPipe) id: string): Promise<ApplicationResponseDto> {
    const detail = await this.applicationService.findByIdWithRelations(id);
    return this.applicationMapper.toResponse(detail);
  }

  @Patch('applications/:id/status')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_APPLICATION_WRITE)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Change application status' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApplicationResponseDto> {
    const updated = await this.applicationService.changeStatus(
      id,
      dto.status as ApplicationStatus,
      user.email,
      dto.notes,
    );
    const detail = await this.applicationService.findByIdWithRelations(updated.id);
    return this.applicationMapper.toResponse(detail);
  }

  @Post('applications/bulk-status')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_APPLICATION_WRITE)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Bulk change application status' })
  @ApiResponse({ status: 200, description: 'Bulk result' })
  async bulkChangeStatus(
    @Body() dto: BulkChangeStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; reason: string }> }> {
    return this.applicationService.bulkChangeStatus(
      dto.applicationIds,
      dto.status as ApplicationStatus,
      user.email,
      dto.notes,
    );
  }

  @Get('applications/:id/messages')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_APPLICATION_READ)
  @ApiOperation({ summary: 'Get application messages' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMessages(@Param('id', ParseUUIDPipe) id: string): Promise<MessageResponseDto[]> {
    await this.applicationService.findById(id);
    await this.messageService.markAsRead(id, 'APPLICANT');
    const messages = await this.messageService.listByApplicationId(id);
    return this.messageMapper.toResponseList(messages);
  }

  @Post('applications/:id/messages')
  @WriteOperation()
  @RequirePermission(Permission.CAREER_APPLICATION_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Send a message to an applicant' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    const application = await this.applicationService.findByIdWithRelations(id);
    const senderName = user.email;

    const message = await this.messageService.createAdminMessage(id, senderName, dto.body);

    this.events.emit('career.admin.message_sent', {
      applicationId: id,
      applicantName: application.applicantName,
      applicantEmail: application.applicantEmail,
      jobTitle: application.jobPosting.title,
      senderName,
    });

    return this.messageMapper.toResponse(message);
  }

  @Get('applications/:id/documents/:docId')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_APPLICATION_READ)
  @ApiOperation({ summary: 'Download application document' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Res() res: Response,
  ): Promise<void> {
    const detail = await this.applicationService.findByIdWithRelations(id);
    const doc = detail.documents.find((d) => d.id === docId);

    if (!doc) {
      res.status(HttpStatus.NOT_FOUND).json({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
      return;
    }

    const stream = this.fileService.createReadStream(doc.storagePath);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.setHeader('Content-Length', doc.sizeBytes.toString());
    stream.pipe(res);
  }

  @Get('analytics')
  @ReadOnlySafe()
  @RequirePermission(Permission.CAREER_ANALYTICS_READ)
  @ApiOperation({ summary: 'Get career analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(): Promise<CareerAnalytics> {
    return this.applicationService.getAnalytics();
  }
}
