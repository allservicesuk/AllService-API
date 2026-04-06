/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Mail module wiring BullMQ queue registration, SmtpTransport, and the MailService enqueue API.
 */
import { Module } from '@nestjs/common';

import { MailService } from './mail.service';
import { SmtpTransport } from './smtp.transport';

@Module({
  providers: [SmtpTransport, MailService],
  exports: [MailService, SmtpTransport],
})
export class MailModule {}
