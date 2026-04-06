/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Application message types for the conversation feature.
 */

export interface MessageResponse {
  readonly id: string;
  readonly senderType: string;
  readonly senderName: string;
  readonly body: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}

export interface SendMessageRequest {
  readonly body: string;
}
