/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Redaction helpers for log output — emails, IPs, and tokens never appear in the clear.
 */
import { createHash } from 'node:crypto';

export function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '[REDACTED_EMAIL]';
  }
  const domainParts = domain.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';
  const domainHead = domainParts[0] ?? '';
  const redactedLocal = `${local[0] ?? 'x'}***`;
  const redactedDomain = `${domainHead[0] ?? 'x'}***${tld ? '.' + tld : ''}`;
  return `${redactedLocal}@${redactedDomain}`;
}

export function redactIp(ip: string): string {
  const hash = createHash('sha256').update(ip, 'utf8').digest('hex').slice(0, 8);
  return `hash:${hash}`;
}

export function redactToken(_token: string): string {
  return '[REDACTED]';
}
