/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Password-changed confirmation template with subject, plain-text, and HTML renderers.
 */
import type { PasswordChangedInput } from '../dto/password-changed-input.dto';

import {
  buildUrl,
  ctaButton,
  escapeHtml,
  greet,
  greetPlain,
  renderHtmlLayout,
  type LayoutOptions,
} from './_layout';

const SUPPORT_PATH = '/support';

export const passwordChangedTemplate = {
  subject: (): string => 'Your AllServices password was changed',

  text: (input: PasswordChangedInput, options: LayoutOptions): string => {
    const supportUrl = buildUrl(options.appWebUrl, SUPPORT_PATH);
    return [
      greetPlain(input.name),
      '',
      `Your AllServices password was changed at ${input.changedAt}.`,
      `IP fingerprint: ${input.ipHash}`,
      '',
      `If this was not you, contact support immediately: ${supportUrl}`,
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: PasswordChangedInput, options: LayoutOptions): string => {
    const supportUrl = buildUrl(options.appWebUrl, SUPPORT_PATH);
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Your AllServices password was changed at ${escapeHtml(input.changedAt)}.</p>`,
      `<p class="mono">IP fingerprint: ${escapeHtml(input.ipHash)}</p>`,
      `<p>If this was not you, contact support immediately.</p>`,
      ctaButton(supportUrl, 'Contact support'),
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
