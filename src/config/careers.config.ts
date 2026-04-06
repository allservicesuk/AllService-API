/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Careers module config namespace for upload paths, magic-link TTL, verification code TTL, and apply web URL.
 */
import { registerAs } from '@nestjs/config';

export interface CareersConfig {
  readonly uploadBasePath: string;
  readonly magicLinkTtlSeconds: number;
  readonly verifyCodeTtlSeconds: number;
  readonly applyWebUrl: string;
}

export default registerAs('careers', (): CareersConfig => {
  const magicLinkTtl = process.env['CAREERS_MAGIC_LINK_TTL_SECONDS'];
  const verifyCodeTtl = process.env['CAREERS_VERIFY_CODE_TTL_SECONDS'];
  return {
    uploadBasePath: process.env['CAREERS_UPLOAD_BASE_PATH'] ?? '.tmp/uploads/careers',
    magicLinkTtlSeconds: magicLinkTtl ? parseInt(magicLinkTtl, 10) : 604800,
    verifyCodeTtlSeconds: verifyCodeTtl ? parseInt(verifyCodeTtl, 10) : 600,
    applyWebUrl: process.env['CAREERS_APPLY_WEB_URL'] ?? 'https://apply.allservices.cc',
  };
});
