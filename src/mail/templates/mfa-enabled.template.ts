/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * MFA-enabled confirmation template with subject, plain-text, and HTML renderers.
 */
import type { MfaEnabledInput } from '../dto/mfa-enabled-input.dto';

import {
  buildUrl,
  ctaButton,
  escapeHtml,
  greet,
  greetPlain,
  renderHtmlLayout,
  type LayoutOptions,
} from './_layout';

const MFA_PATH = '/account/security';

export const mfaEnabledTemplate = {
  subject: (): string => 'Two-factor authentication enabled',

  text: (input: MfaEnabledInput, options: LayoutOptions): string => {
    const securityUrl = buildUrl(options.appWebUrl, MFA_PATH);
    return [
      greetPlain(input.name),
      '',
      'Two-factor authentication is now active on your AllServices account.',
      '',
      'Store your recovery codes somewhere safe — you will need them if you lose access to your authenticator app.',
      `Manage security settings: ${securityUrl}`,
      '',
      'If you did not enable this, contact support immediately.',
      '',
      '— AllServices',
    ].join('\n');
  },

  html: (input: MfaEnabledInput, options: LayoutOptions): string => {
    const securityUrl = buildUrl(options.appWebUrl, MFA_PATH);
    const body = [
      `<p>${greet(input.name)}</p>`,
      '<p>Two-factor authentication is now active on your AllServices account.</p>',
      '<p>Store your recovery codes somewhere safe — you will need them if you lose access to your authenticator app.</p>',
      ctaButton(securityUrl, 'Manage security settings'),
      '<p>If you did not enable this, contact support immediately.</p>',
    ].join('');
    return renderHtmlLayout(body, options);
  },
};
