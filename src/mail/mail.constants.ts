/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Queue name and per-template job-name constants shared by the mail service and processor.
 */
export const MAIL_QUEUE_NAME = 'mail';

export const MailJobName = {
  SEND_VERIFICATION: 'send-verification',
  SEND_PASSWORD_RESET: 'send-password-reset',
  SEND_LOGIN_NOTIFICATION: 'send-login-notification',
  SEND_ACCOUNT_LOCKED: 'send-account-locked',
  SEND_MFA_ENABLED: 'send-mfa-enabled',
  SEND_PASSWORD_CHANGED: 'send-password-changed',
  SEND_APPLICATION_VERIFY: 'send-application-verify',
  SEND_APPLICATION_RECEIVED: 'send-application-received',
  SEND_APPLICATION_STATUS_CHANGED: 'send-application-status-changed',
  SEND_APPLICATION_NEW_MESSAGE: 'send-application-new-message',
  SEND_APPLICATION_INTERVIEW_INVITE: 'send-application-interview-invite',
  SEND_APPLICATION_REJECTED: 'send-application-rejected',
} as const;

export type MailJobNameCode = (typeof MailJobName)[keyof typeof MailJobName];
