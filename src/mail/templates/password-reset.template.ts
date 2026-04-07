/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Password-reset template with subject, plain-text, and HTML renderers.
 */
import type { PasswordResetInput } from '../dto/password-reset-input.dto';

import {
  buildUrl,
  ctaButton,
  escapeHtml,
  greet,
  greetPlain,
  renderHtmlLayout,
  type LayoutOptions,
} from './_layout';

const RESET_PATH = '/reset-password';

export const passwordResetTemplate = {
  subject: (): string => 'Reset your AllServices password',

  text: (input: PasswordResetInput, options: LayoutOptions): string => {
    const resetUrl = buildUrl(options.appWebUrl, RESET_PATH, { token: input.token });
    return [
      greetPlain(input.name),
      '',
      'We received a request to reset your AllServices password.',
      '',
      `Reset link: ${resetUrl}`,
      `This link expires at ${input.expiresAt} (within one hour).`,
      '',
      'If you did not request a reset, you can ignore this email — your password will remain unchanged.',
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: PasswordResetInput, options: LayoutOptions): string => {
    const resetUrl = buildUrl(options.appWebUrl, RESET_PATH, { token: input.token });
    const body = [
      `<p>${greet(input.name)}</p>`,
      '<p>We received a request to reset your AllServices password.</p>',
      ctaButton(resetUrl, 'Reset password'),
      `<p class="mono">This link expires at ${escapeHtml(input.expiresAt)} (within one hour).</p>`,
      '<p>If you did not request a reset, you can ignore this email — your password will remain unchanged.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
