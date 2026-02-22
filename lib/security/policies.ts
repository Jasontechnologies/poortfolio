import type { RateLimitRule } from '@/lib/security/rate-limit';

export const SIGNUP_RATE_LIMITS = {
  minute: { bucket: '1m', limit: 2, windowSeconds: 60 },
  hour: { bucket: '1h', limit: 5, windowSeconds: 60 * 60 }
} as const;

export const LOGIN_FAILURE_RATE_LIMIT = {
  bucket: 'failed_5m',
  limit: 5,
  windowSeconds: 5 * 60
} as const;

export const CHAT_RATE_LIMITS = {
  userMinute: { bucket: '1m', limit: 20, windowSeconds: 60 },
  ipMinute: { bucket: '1m', limit: 60, windowSeconds: 60 },
  abuse: { bucket: 'abuse_10m', limit: 2, windowSeconds: 10 * 60 }
} as const;

export const AUTH_REGISTER_IP_LIMITS: RateLimitRule[] = [
  { name: '1m', limit: 2, windowMs: 60 * 1000 },
  { name: '1h', limit: 5, windowMs: 60 * 60 * 1000 }
];

export const AUTH_LOGIN_IP_LIMITS: RateLimitRule[] = [
  { name: '1m', limit: 10, windowMs: 60 * 1000 }
];

export const AUTH_REFRESH_USER_LIMITS: RateLimitRule[] = [
  { name: '1m', limit: 30, windowMs: 60 * 1000 }
];

export const CHAT_MESSAGE_USER_LIMITS: RateLimitRule[] = [
  { name: '1m', limit: 20, windowMs: 60 * 1000 }
];

export const CHAT_MESSAGE_IP_LIMITS: RateLimitRule[] = [
  { name: '1m', limit: 60, windowMs: 60 * 1000 }
];

export const CONTACT_IP_LIMITS: RateLimitRule[] = [
  { name: '1h', limit: 3, windowMs: 60 * 60 * 1000 }
];

export const COMPLAINT_CREATE_USER_LIMITS: RateLimitRule[] = [
  { name: '1h', limit: 8, windowMs: 60 * 60 * 1000 }
];

export const COMPLAINT_CREATE_IP_LIMITS: RateLimitRule[] = [
  { name: '1h', limit: 20, windowMs: 60 * 60 * 1000 }
];

export const AUTH_FAILURE_WINDOW_MS = 10 * 60 * 1000;
export const AUTH_CAPTCHA_FAILURE_THRESHOLD = 6;
export const CHAT_MESSAGE_COOLDOWN_SECONDS = 3;
export const CHAT_MAX_OPEN_THREADS = 3;
