/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Shared HTML layout wrapper and URL builder used by every transactional mail template.
 */
const HTML_DOCTYPE = '<!doctype html>';
const BRAND_NAME = 'AllServices';
const LEGAL_FOOTER = 'AllServices — ALS Marketing UK Ltd';

export interface LayoutOptions {
  readonly appWebUrl: string;
}

export function renderHtmlLayout(bodyHtml: string, options: LayoutOptions): string {
  return [
    HTML_DOCTYPE,
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>${BRAND_NAME}</title>`,
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<style>',
    'body{margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1b1f24}',
    '.wrap{max-width:560px;margin:0 auto;padding:32px 16px;text-align:center}',
    '.card{background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(16,24,40,0.08)}',
    '.brand{font-size:20px;font-weight:700;margin-bottom:24px;color:#0b1221}',
    '.body{font-size:15px;line-height:1.6;color:#333f4d}',
    '.cta{display:inline-block;margin:20px 0;padding:12px 24px;background:#ff8fbb;color:#141414;text-decoration:none;border-radius:8px;font-weight:600}',
    '.footer{margin-top:24px;font-size:12px;color:#6b7785;text-align:center}',
    '.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:#6b7785}',
    '</style></head><body>',
    '<div class="wrap"><div class="card">',
    `<div class="brand">${BRAND_NAME}</div>`,
    `<div class="body">${bodyHtml}</div>`,
    '</div>',
    `<div class="footer">${LEGAL_FOOTER}<br><a href="${escapeHtml(options.appWebUrl)}">${BRAND_NAME}</a></div>`,
    '</div></body></html>',
  ].join('');
}

export function buildUrl(
  appWebUrl: string,
  path: string,
  params: Record<string, string> = {},
): string {
  const base = appWebUrl.replace(/\/+$/, '');
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query.length > 0 ? `${base}${normalisedPath}?${query}` : `${base}${normalisedPath}`;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function greet(name: string | undefined): string {
  return name && name.trim().length > 0 ? `Hi ${escapeHtml(name.trim())},` : 'Hi there,';
}

export function greetPlain(name: string | undefined): string {
  return name && name.trim().length > 0 ? `Hi ${name.trim()},` : 'Hi there,';
}
