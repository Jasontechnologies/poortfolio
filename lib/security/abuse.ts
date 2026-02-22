import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

const disposableDomains = new Set([
  '10minutemail.com',
  '1secmail.com',
  '1secmail.org',
  '20minutemail.com',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'mintemail.com',
  'sharklasers.com',
  'tempmail.dev',
  'tempmailo.com',
  'tempmail.plus',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com'
]);

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return true;
  return disposableDomains.has(domain);
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function sanitizeMessage(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function isLikelyUrl(value: string): boolean {
  return /(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(value);
}
