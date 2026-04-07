/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * New-device login notification template with subject, plain-text, and HTML renderers.
 */
import type { LoginNotificationInput } from '../dto/login-notification-input.dto';

import {
  buildUrl,
  ctaButton,
  escapeHtml,
  greet,
  greetPlain,
  renderHtmlLayout,
  type LayoutOptions,
} from './_layout';

const SESSIONS_PATH = '/account/sessions';

function formatLocation(input: LoginNotificationInput): string {
  const parts: string[] = [];
  if (input.city && input.city.trim().length > 0) {
    parts.push(input.city.trim());
  }
  if (input.country && input.country.trim().length > 0) {
    parts.push(input.country.trim().toUpperCase());
  }
  return parts.length > 0 ? parts.join(', ') : 'unknown location';
}

export const loginNotificationTemplate = {
  subject: (): string => 'New sign-in to your AllServices account',

  text: (input: LoginNotificationInput, options: LayoutOptions): string => {
    const revokeUrl = buildUrl(options.appWebUrl, SESSIONS_PATH);
    const location = formatLocation(input);
    return [
      greetPlain(input.name),
      '',
      `A new sign-in to your AllServices account was detected at ${input.loginAt}.`,
      '',
      `Device: ${input.device}`,
      `Location: ${location}`,
      `IP fingerprint: ${input.ipHash}`,
      '',
      `If this was you, no action is needed.`,
      `If this was not you, revoke the session now: ${revokeUrl}`,
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: LoginNotificationInput, options: LayoutOptions): string => {
    const revokeUrl = buildUrl(options.appWebUrl, SESSIONS_PATH);
    const location = formatLocation(input);
    const body = [
      `<p>${greet(input.name)}</p>`,
      `<p>A new sign-in to your AllServices account was detected at ${escapeHtml(input.loginAt)}.</p>`,
      '<p class="mono">',
      `Device: ${escapeHtml(input.device)}<br>`,
      `Location: ${escapeHtml(location)}<br>`,
      `IP fingerprint: ${escapeHtml(input.ipHash)}`,
      '</p>',
      '<p>If this was you, no action is needed.</p>',
      ctaButton(revokeUrl, 'Revoke session'),
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
