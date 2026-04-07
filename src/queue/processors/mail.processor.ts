/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * BullMQ worker that renders transactional mail templates and dispatches them through SmtpTransport.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import type { Job } from 'bullmq';

import mailConfig from '@config/mail.config';
import regionConfig from '@config/region.config';

import { AccountLockedInput } from '../../mail/dto/account-locked-input.dto';
import { ApplicationAccessInput } from '../../mail/dto/application-access-input.dto';
import { ApplicationInterviewInviteInput } from '../../mail/dto/application-interview-invite-input.dto';
import { ApplicationNewMessageInput } from '../../mail/dto/application-new-message-input.dto';
import { ApplicationReceivedInput } from '../../mail/dto/application-received-input.dto';
import { ApplicationRejectedInput } from '../../mail/dto/application-rejected-input.dto';
import { ApplicationStatusChangedInput } from '../../mail/dto/application-status-changed-input.dto';
import { ApplicationVerifyInput } from '../../mail/dto/application-verify-input.dto';
import { LoginNotificationInput } from '../../mail/dto/login-notification-input.dto';
import { MfaEnabledInput } from '../../mail/dto/mfa-enabled-input.dto';
import { PasswordChangedInput } from '../../mail/dto/password-changed-input.dto';
import { PasswordResetInput } from '../../mail/dto/password-reset-input.dto';
import { VerificationInput } from '../../mail/dto/verification-input.dto';
import { MailJobName, type MailJobNameCode } from '../../mail/mail.constants';
import type { SendMailOptions } from '../../mail/smtp.transport';
import { SmtpTransport } from '../../mail/smtp.transport';
import { accountLockedTemplate } from '../../mail/templates/account-locked.template';
import { applicationInterviewInviteTemplate } from '../../mail/templates/application-interview-invite.template';
import { applicationNewMessageTemplate } from '../../mail/templates/application-new-message.template';
import { applicationAccessTemplate } from '../../mail/templates/application-access.template';
import { applicationReceivedTemplate } from '../../mail/templates/application-received.template';
import { applicationRejectedTemplate } from '../../mail/templates/application-rejected.template';
import { applicationStatusChangedTemplate } from '../../mail/templates/application-status-changed.template';
import { applicationVerifyTemplate } from '../../mail/templates/application-verify.template';
import type { LayoutOptions } from '../../mail/templates/_layout';
import { loginNotificationTemplate } from '../../mail/templates/login-notification.template';
import { mfaEnabledTemplate } from '../../mail/templates/mfa-enabled.template';
import { passwordChangedTemplate } from '../../mail/templates/password-changed.template';
import { passwordResetTemplate } from '../../mail/templates/password-reset.template';
import { verificationTemplate } from '../../mail/templates/verification.template';
import { MetricsService } from '../../observability/metrics.service';
import { SentryService } from '../../observability/sentry.service';
import { MAIL_WORKER_CONCURRENCY, QueueName } from '../queue.constants';

const SEND_STATUS_SUCCESS = 'success';
const SEND_STATUS_FAILURE = 'failure';
const EMAIL_MASK_VISIBLE = 2;
const NS_PER_SEC = 1_000_000_000;

@Processor(QueueName.MAIL, { concurrency: MAIL_WORKER_CONCURRENCY })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly transport: SmtpTransport,
    private readonly metrics: MetricsService,
    private readonly sentry: SentryService,
    @Inject(mailConfig.KEY) private readonly mail: ConfigType<typeof mailConfig>,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, string>): Promise<{ messageId: string }> {
    const jobName = job.name as MailJobNameCode;
    const layoutOptions: LayoutOptions = { appWebUrl: this.mail.appWebUrl };
    const startedAt = process.hrtime.bigint();
    try {
      const options = await this.renderJob(jobName, job.data, layoutOptions);
      const result = await this.transport.sendMail(options);
      this.recordSuccess(jobName, startedAt);
      this.logger.log(
        `mail.sent type=${jobName} jobId=${job.id ?? 'unknown'} to=${this.maskEmail(options.to)} messageId=${result.messageId}`,
      );
      return { messageId: result.messageId };
    } catch (error) {
      this.recordFailure(jobName, startedAt);
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `mail.send.failed type=${jobName} jobId=${job.id ?? 'unknown'} attempt=${job.attemptsMade + 1}/${job.opts.attempts ?? 1} reason=${message}`,
      );
      this.sentry.captureException(error, {
        region: this.region.region,
        tags: { queue: QueueName.MAIL, jobName },
      });
      throw error;
    }
  }

  private async renderJob(
    jobName: MailJobNameCode,
    payload: unknown,
    layout: LayoutOptions,
  ): Promise<SendMailOptions> {
    switch (jobName) {
      case MailJobName.SEND_VERIFICATION: {
        const input = await this.validatePayload(VerificationInput, payload, jobName);
        return {
          to: input.to,
          subject: verificationTemplate.subject(input.name),
          text: verificationTemplate.text(input, layout),
          html: verificationTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_PASSWORD_RESET: {
        const input = await this.validatePayload(PasswordResetInput, payload, jobName);
        return {
          to: input.to,
          subject: passwordResetTemplate.subject(),
          text: passwordResetTemplate.text(input, layout),
          html: passwordResetTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_LOGIN_NOTIFICATION: {
        const input = await this.validatePayload(LoginNotificationInput, payload, jobName);
        return {
          to: input.to,
          subject: loginNotificationTemplate.subject(),
          text: loginNotificationTemplate.text(input, layout),
          html: loginNotificationTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_ACCOUNT_LOCKED: {
        const input = await this.validatePayload(AccountLockedInput, payload, jobName);
        return {
          to: input.to,
          subject: accountLockedTemplate.subject(),
          text: accountLockedTemplate.text(input, layout),
          html: accountLockedTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_MFA_ENABLED: {
        const input = await this.validatePayload(MfaEnabledInput, payload, jobName);
        return {
          to: input.to,
          subject: mfaEnabledTemplate.subject(),
          text: mfaEnabledTemplate.text(input, layout),
          html: mfaEnabledTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_PASSWORD_CHANGED: {
        const input = await this.validatePayload(PasswordChangedInput, payload, jobName);
        return {
          to: input.to,
          subject: passwordChangedTemplate.subject(),
          text: passwordChangedTemplate.text(input, layout),
          html: passwordChangedTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_VERIFY: {
        const input = await this.validatePayload(ApplicationVerifyInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationVerifyTemplate.subject(input.jobTitle),
          text: applicationVerifyTemplate.text(input, layout),
          html: applicationVerifyTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_RECEIVED: {
        const input = await this.validatePayload(ApplicationReceivedInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationReceivedTemplate.subject(input.jobTitle),
          text: applicationReceivedTemplate.text(input, layout),
          html: applicationReceivedTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_STATUS_CHANGED: {
        const input = await this.validatePayload(ApplicationStatusChangedInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationStatusChangedTemplate.subject(input.jobTitle, input.newStatus),
          text: applicationStatusChangedTemplate.text(input, layout),
          html: applicationStatusChangedTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_NEW_MESSAGE: {
        const input = await this.validatePayload(ApplicationNewMessageInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationNewMessageTemplate.subject(input.jobTitle),
          text: applicationNewMessageTemplate.text(input, layout),
          html: applicationNewMessageTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_INTERVIEW_INVITE: {
        const input = await this.validatePayload(ApplicationInterviewInviteInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationInterviewInviteTemplate.subject(input.jobTitle),
          text: applicationInterviewInviteTemplate.text(input, layout),
          html: applicationInterviewInviteTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_REJECTED: {
        const input = await this.validatePayload(ApplicationRejectedInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationRejectedTemplate.subject(input.jobTitle),
          text: applicationRejectedTemplate.text(input, layout),
          html: applicationRejectedTemplate.html(input, layout),
        };
      }
      case MailJobName.SEND_APPLICATION_ACCESS: {
        const input = await this.validatePayload(ApplicationAccessInput, payload, jobName);
        return {
          to: input.to,
          subject: applicationAccessTemplate.subject(input.jobTitle),
          text: applicationAccessTemplate.text(input, layout),
          html: applicationAccessTemplate.html(input, layout),
        };
      }
      default:
        throw new Error(`mail.processor.unknown_job_name name=${String(jobName)}`);
    }
  }

  private async validatePayload<T extends object>(
    dtoClass: new () => T,
    payload: unknown,
    jobName: MailJobNameCode,
  ): Promise<T> {
    if (payload === null || typeof payload !== 'object') {
      throw new Error(`mail.processor.invalid_payload job=${jobName} reason=not_object`);
    }
    const instance = plainToInstance(dtoClass, payload, { enableImplicitConversion: false });
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new Error(
        `mail.processor.validation_failed job=${jobName} errors=${this.formatErrors(errors)}`,
      );
    }
    return instance;
  }

  private formatErrors(errors: readonly ValidationError[]): string {
    return errors
      .map((err) => {
        const constraints = err.constraints ? Object.values(err.constraints).join(';') : 'invalid';
        return `${err.property}=${constraints}`;
      })
      .join(',');
  }

  private recordSuccess(jobName: MailJobNameCode, startedAt: bigint): void {
    const seconds = this.elapsedSeconds(startedAt);
    this.metrics.mailSentTotal.inc({
      type: jobName,
      status: SEND_STATUS_SUCCESS,
      region: this.region.region,
    });
    this.metrics.mailSendDuration.observe({ type: jobName, region: this.region.region }, seconds);
  }

  private recordFailure(jobName: MailJobNameCode, startedAt: bigint): void {
    const seconds = this.elapsedSeconds(startedAt);
    this.metrics.mailSentTotal.inc({
      type: jobName,
      status: SEND_STATUS_FAILURE,
      region: this.region.region,
    });
    this.metrics.mailSendDuration.observe({ type: jobName, region: this.region.region }, seconds);
  }

  private elapsedSeconds(startedAt: bigint): number {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    return Number(elapsedNs) / NS_PER_SEC;
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
