/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email template notifying an applicant that their application status has changed.
 */
import type { ApplicationStatusChangedInput } from '../dto/application-status-changed-input.dto';

import { ctaButton, escapeHtml, greet, greetPlain, renderHtmlLayout, type LayoutOptions } from './_layout';

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWED: 'Interviewed',
  OFFER_EXTENDED: 'Offer Extended',
  HIRED: 'Hired',
};

function humanizeStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

export const applicationStatusChangedTemplate = {
  subject: (jobTitle: string, newStatus: string): string =>
    `Application update — ${jobTitle}: ${humanizeStatus(newStatus)}`,

  text: (input: ApplicationStatusChangedInput, _options: LayoutOptions): string => {
    return [
      greetPlain(input.name),
      '',
      `Your application for "${input.jobTitle}" has been updated to: ${humanizeStatus(input.newStatus)}.`,
      '',
      'View your application for more details:',
      input.magicLinkUrl,
      '',
      '— AllServices Careers',
    ].join('\n');
  },

  html: (input: ApplicationStatusChangedInput, options: LayoutOptions): string => {
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Your application for &ldquo;${escapeHtml(input.jobTitle)}&rdquo; has been updated to:</p>`,
      `<p style="font-size:18px;font-weight:600;color:#0b1221">${escapeHtml(humanizeStatus(input.newStatus))}</p>`,
      ctaButton(input.magicLinkUrl, 'View my application'),
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
