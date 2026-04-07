/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template for re-sending a magic link when an applicant requests access to their application.
 */
import type { ApplicationAccessInput } from '../dto/application-access-input.dto';

import { escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationAccessTemplate = {
  subject: (jobTitle: string): string => `Your application access link — ${jobTitle}`,

  text: (input: ApplicationAccessInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `You requested access to your application for "${input.jobTitle}" at AllServices.`,
      '',
      'Use the link below to view your application status, messages, and documents:',
      input.magicLinkUrl,
      '',
      'This link will expire in 7 days. If you did not request this, you can safely ignore this email.',
      '',
      'Please keep this link private — it provides direct access to your application.',
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationAccessInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>You requested access to your application for &ldquo;${escapeHtml(input.jobTitle)}&rdquo; at AllServices.</p>`,
      '<p>Use the button below to view your application status, messages, and documents:</p>',
      `<p><a class="cta" href="${escapeHtml(input.magicLinkUrl)}">View my application</a></p>`,
      '<p class="mono">This link will expire in 7 days. If you did not request this, you can safely ignore this email.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
