/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Account-locked notification template with subject, plain-text, and HTML renderers.
 */
import type { AccountLockedInput } from '../dto/account-locked-input.dto';

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

export const accountLockedTemplate = {
  subject: (): string => 'Your AllServices account has been locked',

  text: (input: AccountLockedInput, options: LayoutOptions): string => {
    const supportUrl = buildUrl(options.appWebUrl, SUPPORT_PATH);
    const unlockLine = input.lockedUntil
      ? `You can try signing in again at ${input.lockedUntil}.`
      : 'Contact support to restore access.';
    return [
      greetPlain(input.name),
      '',
      `Your AllServices account has been locked for the following reason: ${input.reason}`,
      '',
      unlockLine,
      `Support: ${supportUrl}`,
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: AccountLockedInput, options: LayoutOptions): string => {
    const supportUrl = buildUrl(options.appWebUrl, SUPPORT_PATH);
    const unlockLine = input.lockedUntil
      ? `<p class="mono">You can try signing in again at ${escapeHtml(input.lockedUntil)}.</p>`
      : ctaButton(supportUrl, 'Contact support');
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>Your AllServices account has been locked.</p>`,
      `<p class="mono">Reason: ${escapeHtml(input.reason)}</p>`,
      unlockLine,
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
