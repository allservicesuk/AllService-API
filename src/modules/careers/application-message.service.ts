/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Manages messages exchanged between admin and applicants on an application thread.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ApplicationMessage, PrismaClient } from '@prisma/client';

import { PRISMA_READ } from '../../database/database.tokens';
import { PRISMA_WRITE } from '../../database/database.tokens';

@Injectable()
export class ApplicationMessageService {
  private readonly logger = new Logger(ApplicationMessageService.name);

  constructor(
    @Inject(PRISMA_READ) private readonly prismaRead: PrismaClient,
    @Inject(PRISMA_WRITE) private readonly prismaWrite: PrismaClient,
  ) {}

  async listByApplicationId(applicationId: string): Promise<ApplicationMessage[]> {
    return this.prismaRead.applicationMessage.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAdminMessage(
    applicationId: string,
    senderName: string,
    body: string,
  ): Promise<ApplicationMessage> {
    const message = await this.prismaWrite.applicationMessage.create({
      data: {
        applicationId,
        senderType: 'ADMIN',
        senderName,
        body,
      },
    });
    this.logger.log(
      `career.message.admin_sent applicationId=${applicationId} messageId=${message.id}`,
    );
    return message;
  }

  async createApplicantMessage(
    applicationId: string,
    senderName: string,
    body: string,
  ): Promise<ApplicationMessage> {
    const message = await this.prismaWrite.applicationMessage.create({
      data: {
        applicationId,
        senderType: 'APPLICANT',
        senderName,
        body,
      },
    });
    this.logger.log(
      `career.message.applicant_sent applicationId=${applicationId} messageId=${message.id}`,
    );
    return message;
  }

  async markAsRead(applicationId: string, senderType: 'ADMIN' | 'APPLICANT'): Promise<number> {
    const result = await this.prismaWrite.applicationMessage.updateMany({
      where: {
        applicationId,
        senderType,
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  }

  async getUnreadCount(applicationId: string, senderType: 'ADMIN' | 'APPLICANT'): Promise<number> {
    return this.prismaRead.applicationMessage.count({
      where: {
        applicationId,
        senderType,
        isRead: false,
      },
    });
  }
}
