/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template for the 6-digit application verification code.
 */
import type { ApplicationVerifyInput } from '../dto/application-verify-input.dto';

import { escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationVerifyTemplate = {
  subject: (jobTitle: string): string => `Your verification code for ${jobTitle}`,

  text: (input: ApplicationVerifyInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `Your verification code for your application to "${input.jobTitle}" is:`,
      '',
      `    ${input.code}`,
      '',
      'This code expires in 10 minutes. If you did not request this, you can safely ignore this email.',
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationVerifyInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Your verification code for your application to &ldquo;${escapeHtml(input.jobTitle)}&rdquo; is:</p>`,
      `<p style="font-size:32px;font-weight:700;letter-spacing:6px;text-align:center;margin:24px 0">${escapeHtml(input.code)}</p>`,
      '<p class="mono">This code expires in 10 minutes.</p>',
      '<p>If you did not request this, you can safely ignore this email.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
