/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Maps Prisma ApplicationMessage records to a plain response shape for API output.
 */
import { Injectable } from '@nestjs/common';
import type { ApplicationMessage } from '@prisma/client';

export interface MessageResponseDto {
  readonly id: string;
  readonly senderType: string;
  readonly senderName: string;
  readonly body: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}

@Injectable()
export class MessageMapper {
  toResponse(message: ApplicationMessage): MessageResponseDto {
    return {
      id: message.id,
      senderType: message.senderType,
      senderName: message.senderName,
      body: message.body,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    };
  }

  toResponseList(messages: readonly ApplicationMessage[]): MessageResponseDto[] {
    return messages.map((m) => this.toResponse(m));
  }
}
