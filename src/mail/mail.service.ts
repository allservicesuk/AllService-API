/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Public mail API — enqueues BullMQ jobs per template and never calls SMTP directly.
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { JobsOptions, Queue } from 'bullmq';

import regionConfig from '@config/region.config';

import { MetricsService } from '../observability/metrics.service';

import type { AccountLockedInput } from './dto/account-locked-input.dto';
import type { ApplicationInterviewInviteInput } from './dto/application-interview-invite-input.dto';
import type { ApplicationNewMessageInput } from './dto/application-new-message-input.dto';
import type { ApplicationReceivedInput } from './dto/application-received-input.dto';
import type { ApplicationRejectedInput } from './dto/application-rejected-input.dto';
import type { ApplicationStatusChangedInput } from './dto/application-status-changed-input.dto';
import type { ApplicationVerifyInput } from './dto/application-verify-input.dto';
import type { LoginNotificationInput } from './dto/login-notification-input.dto';
import type { MfaEnabledInput } from './dto/mfa-enabled-input.dto';
import type { PasswordChangedInput } from './dto/password-changed-input.dto';
import type { PasswordResetInput } from './dto/password-reset-input.dto';
import type { VerificationInput } from './dto/verification-input.dto';
import { MAIL_QUEUE_NAME, MailJobName, type MailJobNameCode } from './mail.constants';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

const LOW_PRIORITY = 10;
const EMAIL_MASK_VISIBLE = 2;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE_NAME) private readonly queue: Queue,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
    private readonly metrics: MetricsService,
  ) {}

  async sendVerificationEmail(input: VerificationInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_VERIFICATION, input);
  }

  async sendPasswordResetEmail(input: PasswordResetInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_PASSWORD_RESET, input);
  }

  async sendLoginNotification(input: LoginNotificationInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_LOGIN_NOTIFICATION, input, { priority: LOW_PRIORITY });
  }

  async sendAccountLockedEmail(input: AccountLockedInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_ACCOUNT_LOCKED, input);
  }

  async sendMfaEnabledEmail(input: MfaEnabledInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_MFA_ENABLED, input);
  }

  async sendPasswordChangedEmail(input: PasswordChangedInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_PASSWORD_CHANGED, input);
  }

  async sendApplicationVerifyEmail(input: ApplicationVerifyInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_VERIFY, input);
  }

  async sendApplicationReceivedEmail(input: ApplicationReceivedInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_RECEIVED, input);
  }

  async sendApplicationStatusChangedEmail(input: ApplicationStatusChangedInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_STATUS_CHANGED, input);
  }

  async sendApplicationNewMessageEmail(input: ApplicationNewMessageInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_NEW_MESSAGE, input);
  }

  async sendApplicationInterviewInviteEmail(input: ApplicationInterviewInviteInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_INTERVIEW_INVITE, input);
  }

  async sendApplicationRejectedEmail(input: ApplicationRejectedInput): Promise<void> {
    await this.enqueue(MailJobName.SEND_APPLICATION_REJECTED, input);
  }

  private async enqueue(
    jobName: MailJobNameCode,
    payload: { readonly to: string },
    overrides: JobsOptions = {},
  ): Promise<void> {
    const options: JobsOptions = { ...DEFAULT_JOB_OPTIONS, ...overrides };
    const job = await this.queue.add(jobName, payload, options);
    this.metrics.mailEnqueuedTotal.inc({ type: jobName, region: this.region.region });
    this.logger.log(
      `mail.enqueued type=${jobName} jobId=${job.id ?? 'unknown'} to=${this.maskEmail(payload.to)}`,
    );
  }

  private maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) {
      return '***';
    }
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    const visible = local.slice(0, EMAIL_MASK_VISIBLE);
    return `${visible}***@${domain}`;
  }
}
