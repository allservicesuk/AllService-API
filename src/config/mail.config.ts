/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Mail config namespace for SMTP credentials, from-address, and transactional web URL base.
 */
import { registerAs } from '@nestjs/config';

export interface MailConfig {
  readonly host: string | null;
  readonly port: number;
  readonly user: string | null;
  readonly pass: string | null;
  readonly from: string;
  readonly appWebUrl: string;
}

export default registerAs('mail', (): MailConfig => {
  const host = process.env['SMTP_HOST'];
  const user = process.env['SMTP_USER'];
  const pass = process.env['SMTP_PASS'];
  return {
    host: host && host.length > 0 ? host : null,
    port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
    user: user && user.length > 0 ? user : null,
    pass: pass && pass.length > 0 ? pass : null,
    from: process.env['SMTP_FROM'] ?? 'no-reply@allservices.cc',
    appWebUrl: process.env['APP_WEB_URL'] ?? 'https://allservices.cc',
  };
});
