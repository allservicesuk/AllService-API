/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Nodemailer SMTP transport wrapper with pooling, verify-on-boot, and dev console/file fallback.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';

import appConfig from '@config/app.config';
import mailConfig from '@config/mail.config';

const SECURE_PORT = 465;
const POOL_MAX_CONNECTIONS = 5;
const POOL_MAX_MESSAGES = 100;
const POOL_RATE_LIMIT = 10;
const CONNECTION_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 20_000;
const DEV_MAIL_DIR = '.tmp/mail';

export interface SendMailOptions {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface SendMailResult {
  readonly messageId: string;
  readonly accepted: readonly string[];
  readonly rejected: readonly string[];
}

@Injectable()
export class SmtpTransport implements OnModuleInit {
  private readonly logger = new Logger(SmtpTransport.name);
  private transporter: Transporter<SMTPPool.SentMessageInfo> | null = null;
  private devFallback = false;

  constructor(
    @Inject(mailConfig.KEY) private readonly config: ConfigType<typeof mailConfig>,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.host) {
      if (this.app.isProduction) {
        throw new Error('SMTP_HOST not set in production');
      }
      this.devFallback = true;
      this.logger.warn('SMTP_HOST not set; using dev console/file fallback');
      return;
    }
    const auth =
      this.config.user && this.config.pass
        ? { user: this.config.user, pass: this.config.pass }
        : undefined;
    this.transporter = createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === SECURE_PORT,
      requireTLS: this.config.port !== SECURE_PORT,
      pool: true,
      maxConnections: POOL_MAX_CONNECTIONS,
      maxMessages: POOL_MAX_MESSAGES,
      rateLimit: POOL_RATE_LIMIT,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      greetingTimeout: GREETING_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
      ...(auth ? { auth } : {}),
    });
    try {
      await this.transporter.verify();
      this.logger.log(`mail.transport.ready host=${this.config.host} port=${this.config.port}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'verify_failed';
      this.logger.error(`mail.transport.unreachable reason=${message}`);
      if (this.app.isProduction) {
        throw new Error(`SMTP verify failed: ${message}`);
      }
      this.devFallback = true;
      this.transporter = null;
    }
  }

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    if (this.devFallback || !this.transporter) {
      return this.writeToDev(options);
    }
    const info = await this.transporter.sendMail({
      from: this.config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return {
      messageId: info.messageId,
      accepted: info.accepted.map((addr) => String(addr)),
      rejected: info.rejected.map((addr) => String(addr)),
    };
  }

  private async writeToDev(options: SendMailOptions): Promise<SendMailResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = options.to.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeSubject = options.subject.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const filename = `${timestamp}-${safeTo}-${safeSubject}.eml`;
    const eml = [
      `From: ${this.config.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html,
      '',
      '--TEXT--',
      options.text,
    ].join('\r\n');
    await mkdir(DEV_MAIL_DIR, { recursive: true });
    const filepath = join(DEV_MAIL_DIR, filename);
    await writeFile(filepath, eml, 'utf8');
    this.logger.log(
      `mail.dev to=${options.to} subject=${JSON.stringify(options.subject)} file=${filepath}`,
    );
    return {
      messageId: `dev-${timestamp}`,
      accepted: [options.to],
      rejected: [],
    };
  }
}
