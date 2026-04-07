/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Listens to career domain events and dispatches transactional emails and Discord notifications.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import careersConfig from '@config/careers.config';

import { MailService } from '../../mail/mail.service';

import { ApplicantTokenService } from './applicant-token.service';

interface ApplicationSubmittedEvent {
  readonly applicationId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly applicantPhone: string | null;
  readonly coverLetter: string | null;
  readonly customResponses: Record<string, string | number | boolean> | null;
  readonly hasCV: boolean;
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

const COVER_LETTER_MAX_DISPLAY = 500;
const DISCORD_COLOUR_GREEN = 0x22c55e;

@Injectable()
export class CareerEventsListener {
  private readonly logger = new Logger(CareerEventsListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly tokenService: ApplicantTokenService,
    @Inject(careersConfig.KEY) private readonly config: ConfigType<typeof careersConfig>,
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

    await this.sendDiscordApplicationNotification(event);
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

  private async sendDiscordApplicationNotification(
    event: ApplicationSubmittedEvent,
  ): Promise<void> {
    if (!this.config.discordWebhookUrl) {
      return;
    }

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: 'Name', value: event.applicantName, inline: true },
      { name: 'Email', value: event.applicantEmail, inline: true },
    ];

    if (event.applicantPhone) {
      fields.push({ name: 'Phone', value: event.applicantPhone, inline: true });
    }

    fields.push({ name: 'Position', value: event.jobTitle, inline: true });
    fields.push({ name: 'CV Attached', value: event.hasCV ? 'Yes' : 'No', inline: true });
    fields.push({ name: 'Application ID', value: event.applicationId, inline: false });

    if (event.coverLetter) {
      const truncated =
        event.coverLetter.length > COVER_LETTER_MAX_DISPLAY
          ? `${event.coverLetter.slice(0, COVER_LETTER_MAX_DISPLAY)}...`
          : event.coverLetter;
      fields.push({ name: 'Cover Letter', value: truncated, inline: false });
    }

    if (event.customResponses) {
      const entries = Object.entries(event.customResponses);
      for (const [key, value] of entries) {
        fields.push({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: String(value),
          inline: true,
        });
      }
    }

    const payload = {
      embeds: [
        {
          title: 'New Application Received',
          color: DISCORD_COLOUR_GREEN,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: 'AllServices Careers' },
        },
      ],
    };

    try {
      const response = await fetch(this.config.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(
          `career.event.discord.failed applicationId=${event.applicationId} status=${response.status}`,
        );
      } else {
        this.logger.log(`career.event.discord.sent applicationId=${event.applicationId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(
        `career.event.discord.error applicationId=${event.applicationId} reason=${message}`,
      );
    }
  }
}
