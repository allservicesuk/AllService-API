/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Careers module wiring controllers, services, mappers, guards, and event listeners.
 */
import { Module } from '@nestjs/common';

import { MailModule } from '../../mail/mail.module';

import { AdminCareersController } from './admin-careers.controller';
import { ApplicantController } from './applicant.controller';
import { ApplicantTokenGuard } from './applicant-token.guard';
import { ApplicantTokenService } from './applicant-token.service';
import { ApplicationMapper } from './application.mapper';
import { ApplicationMessageService } from './application-message.service';
import { ApplicationService } from './application.service';
import { CareerEventsListener } from './career-events.listener';
import { CareerFileService } from './career-file.service';
import { MessageMapper } from './message.mapper';
import { PostingMapper } from './posting.mapper';
import { PostingService } from './posting.service';
import { PublicPostingsController } from './public-postings.controller';

@Module({
  imports: [MailModule],
  controllers: [PublicPostingsController, ApplicantController, AdminCareersController],
  providers: [
    PostingService,
    ApplicationService,
    ApplicantTokenService,
    ApplicationMessageService,
    CareerFileService,
    PostingMapper,
    ApplicationMapper,
    MessageMapper,
    ApplicantTokenGuard,
    CareerEventsListener,
  ],
  exports: [PostingService, ApplicationService, ApplicantTokenService],
})
export class CareersModule {}
