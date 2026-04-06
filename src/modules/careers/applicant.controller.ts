/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Applicant-facing controller for submitting applications, verifying email, magic-link access, messaging, and withdrawal.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '@common/decorators/public.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { WriteOperation } from '@common/decorators/write-operation.decorator';
import { ErrorCode } from '@common/constants/error-codes';

import { ApplicantTokenGuard } from './applicant-token.guard';
import { ApplicantTokenService } from './applicant-token.service';
import { ApplicationMapper } from './application.mapper';
import { ApplicationMessageService } from './application-message.service';
import { ApplicationService } from './application.service';
import { CareerFileService } from './career-file.service';
import type { ApplicationResponseDto } from './dto/application-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { VerifyApplicationEmailDto } from './dto/verify-application-email.dto';
import { RequestAccessDto } from './dto/request-access.dto';
import { MessageMapper, type MessageResponseDto } from './message.mapper';
import { MailService } from '../../mail/mail.service';
import { PostingService } from './posting.service';

const FILE_FIELD = 'cv';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('careers')
@Controller({ path: 'careers/applications', version: '1' })
export class ApplicantController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly tokenService: ApplicantTokenService,
    private readonly messageService: ApplicationMessageService,
    private readonly fileService: CareerFileService,
    private readonly applicationMapper: ApplicationMapper,
    private readonly messageMapper: MessageMapper,
    private readonly mailService: MailService,
    private readonly postingService: PostingService,
  ) {}

  @Post('verify-email')
  @Public()
  @WriteOperation()
  @RateLimit(5, 60)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Send a 6-digit verification code to applicant email' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  async verifyEmail(@Body() dto: VerifyApplicationEmailDto): Promise<{ sent: boolean }> {
    const posting = await this.postingService.findById(dto.jobPostingId);
    const code = await this.tokenService.generateVerificationCode(dto.email, dto.jobPostingId);

    await this.mailService.sendApplicationVerifyEmail({
      to: dto.email,
      code,
      jobTitle: posting.title,
    });

    return { sent: true };
  }

  @Post()
  @Public()
  @WriteOperation()
  @RateLimit(3, 3600)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor(FILE_FIELD, { limits: { fileSize: MAX_FILE_SIZE } }))
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a job application with optional CV upload' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  async submit(
    @Body() dto: SubmitApplicationDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ApplicationResponseDto> {
    if (file && !this.fileService.isAllowedMimeType(file.mimetype)) {
      throw new BadRequestException({
        code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
        message: 'File type not allowed. Accepted: PDF, DOC, DOCX, PNG, JPG',
      });
    }

    if (file && file.size > this.fileService.getMaxFileSizeBytes()) {
      throw new BadRequestException({
        code: ErrorCode.UPLOAD_FILE_TOO_LARGE,
        message: 'File exceeds maximum size of 10MB',
      });
    }

    const ipAddress = (req as Request & { realIp?: string }).realIp ?? req.ip ?? '0.0.0.0';

    const { application } = await this.applicationService.submit(dto, ipAddress, file);

    const full = await this.applicationService.findByIdWithRelations(application.id);
    return this.applicationMapper.toResponse(full);
  }

  @Post('access')
  @Public()
  @WriteOperation()
  @RateLimit(5, 60)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Request a new magic-link access token via email' })
  @ApiResponse({ status: 200, description: 'Access link sent if application exists' })
  async requestAccess(@Body() dto: RequestAccessDto): Promise<{ sent: boolean }> {
    const application = await this.applicationService
      .findByEmailAndPosting(dto.email, dto.jobPostingId)
      .catch(() => null);

    if (application) {
      const posting = await this.postingService.findById(application.jobPostingId);
      const rawToken = await this.tokenService.generateMagicLinkToken(application.id);
      const magicLinkUrl = this.tokenService.buildMagicLinkUrl(rawToken);

      await this.mailService.sendApplicationReceivedEmail({
        to: application.applicantEmail,
        name: application.applicantName,
        jobTitle: posting.title,
        magicLinkUrl,
      });
    }

    return { sent: true };
  }

  @Get('me')
  @Public()
  @UseGuards(ApplicantTokenGuard)
  @RateLimit(30, 60)
  @ApiOperation({ summary: 'View own application via magic-link token' })
  @ApiResponse({ status: 200, description: 'Application detail' })
  async getMyApplication(
    @Req() req: Request & { applicationId: string },
  ): Promise<ApplicationResponseDto> {
    const detail = await this.applicationService.findByIdWithRelations(req.applicationId);
    return this.applicationMapper.toResponse(detail);
  }

  @Get('me/messages')
  @Public()
  @UseGuards(ApplicantTokenGuard)
  @RateLimit(30, 60)
  @ApiOperation({ summary: 'View conversation messages via magic-link token' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMyMessages(
    @Req() req: Request & { applicationId: string },
  ): Promise<MessageResponseDto[]> {
    await this.messageService.markAsRead(req.applicationId, 'ADMIN');
    const messages = await this.messageService.listByApplicationId(req.applicationId);
    return this.messageMapper.toResponseList(messages);
  }

  @Post('me/messages')
  @Public()
  @WriteOperation()
  @UseGuards(ApplicantTokenGuard)
  @RateLimit(10, 60)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Reply to the hiring team via magic-link token' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMyMessage(
    @Req() req: Request & { applicationId: string },
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const application = await this.applicationService.findById(req.applicationId);
    const message = await this.messageService.createApplicantMessage(
      req.applicationId,
      application.applicantName,
      dto.body,
    );
    return this.messageMapper.toResponse(message);
  }

  @Post('me/withdraw')
  @Public()
  @WriteOperation()
  @UseGuards(ApplicantTokenGuard)
  @RateLimit(3, 3600)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw own application via magic-link token' })
  @ApiResponse({ status: 200, description: 'Application withdrawn' })
  async withdrawMyApplication(
    @Req() req: Request & { applicationId: string },
  ): Promise<ApplicationResponseDto> {
    const updated = await this.applicationService.withdraw(req.applicationId);
    const detail = await this.applicationService.findByIdWithRelations(updated.id);
    return this.applicationMapper.toResponse(detail);
  }
}
