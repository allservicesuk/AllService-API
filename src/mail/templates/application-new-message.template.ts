/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template notifying an applicant that a new message has been sent by the hiring team.
 */
import type { ApplicationNewMessageInput } from '../dto/application-new-message-input.dto';

import { escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationNewMessageTemplate = {
  subject: (jobTitle: string): string => `New message — ${jobTitle}`,

  text: (input: ApplicationNewMessageInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `You have a new message from ${input.senderName} regarding your application for "${input.jobTitle}".`,
      '',
      'View and reply to the message:',
      input.magicLinkUrl,
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationNewMessageInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>You have a new message from <strong>${escapeHtml(input.senderName)}</strong> regarding your application for &ldquo;${escapeHtml(input.jobTitle)}&rdquo;.</p>`,
      `<p><a class="cta" href="${escapeHtml(input.magicLinkUrl)}">View message</a></p>`,
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
