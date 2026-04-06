/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Listens to career domain events and dispatches transactional emails via the mail service.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MailService } from '../../mail/mail.service';

import { ApplicantTokenService } from './applicant-token.service';

interface ApplicationSubmittedEvent {
  readonly applicationId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly jobPostingId: string;
  readonly jobTitle: string;
  readonly magicLinkUrl: string;
}

interface ApplicationStatusChangedEvent {
  readonly applicationId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly jobTitle: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly notes?: string;
}

interface AdminMessageSentEvent {
  readonly applicationId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly jobTitle: string;
  readonly senderName: string;
}

@Injectable()
export class CareerEventsListener {
  private readonly logger = new Logger(CareerEventsListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly tokenService: ApplicantTokenService,
  ) {}

  @OnEvent('career.application.submitted')
  async onApplicationSubmitted(event: ApplicationSubmittedEvent): Promise<void> {
    await this.mailService.sendApplicationReceivedEmail({
      to: event.applicantEmail,
      name: event.applicantName,
      jobTitle: event.jobTitle,
      magicLinkUrl: event.magicLinkUrl,
    });
    this.logger.log(`career.event.submitted.email_sent applicationId=${event.applicationId}`);
  }

  @OnEvent('career.application.status_changed')
  async onStatusChanged(event: ApplicationStatusChangedEvent): Promise<void> {
    const rawToken = await this.tokenService.generateMagicLinkToken(event.applicationId);
    const magicLinkUrl = this.tokenService.buildMagicLinkUrl(rawToken);

    if (event.toStatus === 'REJECTED') {
      await this.mailService.sendApplicationRejectedEmail({
        to: event.applicantEmail,
        name: event.applicantName,
        jobTitle: event.jobTitle,
      });
    } else if (event.toStatus === 'INTERVIEW_SCHEDULED') {
      await this.mailService.sendApplicationInterviewInviteEmail({
        to: event.applicantEmail,
        name: event.applicantName,
        jobTitle: event.jobTitle,
        ...(event.notes !== undefined ? { notes: event.notes } : {}),
        magicLinkUrl,
      });
    } else {
      await this.mailService.sendApplicationStatusChangedEmail({
        to: event.applicantEmail,
        name: event.applicantName,
        jobTitle: event.jobTitle,
        newStatus: event.toStatus,
        magicLinkUrl,
      });
    }

    this.logger.log(
      `career.event.status_changed.email_sent applicationId=${event.applicationId} to=${event.toStatus}`,
    );
  }

  @OnEvent('career.admin.message_sent')
  async onAdminMessageSent(event: AdminMessageSentEvent): Promise<void> {
    const rawToken = await this.tokenService.generateMagicLinkToken(event.applicationId);
    const magicLinkUrl = this.tokenService.buildMagicLinkUrl(rawToken);

    await this.mailService.sendApplicationNewMessageEmail({
      to: event.applicantEmail,
      name: event.applicantName,
      jobTitle: event.jobTitle,
      senderName: event.senderName,
      magicLinkUrl,
    });
    this.logger.log(`career.event.admin_message.email_sent applicationId=${event.applicationId}`);
  }
}
