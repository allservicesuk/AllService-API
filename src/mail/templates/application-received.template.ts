/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template confirming an application has been received, with a magic link for ongoing access.
 */
import type { ApplicationReceivedInput } from '../dto/application-received-input.dto';

import { escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

export const applicationReceivedTemplate = {
  subject: (jobTitle: string): string => `Application received — ${jobTitle}`,

  text: (input: ApplicationReceivedInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `Thank you for applying to "${input.jobTitle}" at AllServices. Your application has been received and is now under review.`,
      '',
      'You can check your application status and communicate with our hiring team at any time using this link:',
      input.magicLinkUrl,
      '',
      'Please keep this link private — it provides direct access to your application.',
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationReceivedInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Thank you for applying to &ldquo;${escapeHtml(input.jobTitle)}&rdquo; at AllServices. Your application has been received and is now under review.</p>`,
      '<p>You can check your application status and communicate with our hiring team at any time:</p>',
      `<p><a class="cta" href="${escapeHtml(input.magicLinkUrl)}">View my application</a></p>`,
      '<p class="mono">Please keep this link private — it provides direct access to your application.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
