/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template notifying an applicant that their application has been declined.
 */
import type { ApplicationRejectedInput } from '../dto/application-rejected-input.dto';

import { escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationRejectedTemplate = {
  subject: (jobTitle: string): string => `Application update — ${jobTitle}`,

  text: (input: ApplicationRejectedInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `Thank you for your interest in the "${input.jobTitle}" position at AllServices.`,
      '',
      'After careful consideration, we have decided not to move forward with your application at this time. We appreciate the effort you put into your application and encourage you to apply for future openings that match your skills.',
      '',
      'We wish you the best in your career.',
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationRejectedInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Thank you for your interest in the &ldquo;${escapeHtml(input.jobTitle)}&rdquo; position at AllServices.</p>`,
      '<p>After careful consideration, we have decided not to move forward with your application at this time. We appreciate the effort you put into your application and encourage you to apply for future openings that match your skills.</p>',
      '<p>We wish you the best in your career.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
