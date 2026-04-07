/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template notifying an applicant that they have been invited to an interview.
 */
import type { ApplicationInterviewInviteInput } from '../dto/application-interview-invite-input.dto';

import { ctaButton, escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationInterviewInviteTemplate = {
  subject: (jobTitle: string): string => `Interview invitation — ${jobTitle}`,

  text: (input: ApplicationInterviewInviteInput, _options: LayoutOptions): string => {
    const lines = [
      greetPlain(input.name),
      '',
      `Congratulations! You have been invited to interview for the "${input.jobTitle}" position at AllServices.`,
    ];
    if (input.notes && input.notes.trim().length > 0) {
      lines.push('', `Details: ${input.notes.trim()}`);
    }
    lines.push(
      '',
      'View your application for more details:',
      input.magicLinkUrl,
      '',
      '— AllServices Careers',
    );
    return lines.join('\n');
  },

  html: (input: ApplicationInterviewInviteInput, options: LayoutOptions): string => {
    const parts = [
      `<p>${greet(input.name)}</p>`,
      `<p>Congratulations! You have been invited to interview for the &ldquo;${escapeHtml(input.jobTitle)}&rdquo; position at AllServices.</p>`,
    ];
    if (input.notes && input.notes.trim().length > 0) {
      parts.push(`<p><strong>Details:</strong> ${escapeHtml(input.notes.trim())}</p>`);
    }
    parts.push(
      ctaButton(input.magicLinkUrl, 'View my application'),
    );
    return renderHtmlLayout(parts.join(''), options);
  },
};
