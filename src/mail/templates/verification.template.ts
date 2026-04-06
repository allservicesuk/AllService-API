/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Email-verification template with subject, plain-text, and HTML renderers.
 */
import type { VerificationInput } from '../dto/verification-input.dto';

import {
  buildUrl,
  escapeHtml,
  greet,
  greetPlain,
  renderHtmlLayout,
  type LayoutOptions,
} from './_layout';

const VERIFY_PATH = '/verify-email';

export const verificationTemplate = {
  subject: (name?: string): string =>
    name && name.trim().length > 0
      ? `${name.trim()}, verify your AllServices email`
      : 'Verify your AllServices email',

  text: (input: VerificationInput, options: LayoutOptions): string => {
    const verifyUrl = buildUrl(options.appWebUrl, VERIFY_PATH, { token: input.token });
    return [
      greetPlain(input.name),
      '',
      'Welcome to AllServices. Please verify your email address to activate your account.',
      '',
      `Verification link: ${verifyUrl}`,
      `This link expires at ${input.expiresAt}.`,
      '',
      'If you did not create this account, you can safely ignore this message.',
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: VerificationInput, options: LayoutOptions): string => {
    const verifyUrl = buildUrl(options.appWebUrl, VERIFY_PATH, { token: input.token });
    const body = [
      `<p>${greet(input.name)}</p>`,
      '<p>Welcome to AllServices. Please verify your email address to activate your account.</p>',
      `<p><a class="cta" href="${escapeHtml(verifyUrl)}">Verify email</a></p>`,
      `<p class="mono">This link expires at ${escapeHtml(input.expiresAt)}.</p>`,
      '<p>If you did not create this account, you can safely ignore this message.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
