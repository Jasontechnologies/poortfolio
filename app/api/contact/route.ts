import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, hashValue, isValidEmail, sanitizeMessage } from '@/lib/security/abuse';
import { CONTACT_IP_LIMITS } from '@/lib/security/policies';
import { enforceRateLimits } from '@/lib/security/rate-limit';

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
  honeypot?: string;
  fingerprint?: string;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = enforceRateLimits(`contact:ip:${ip}`, CONTACT_IP_LIMITS);

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many contact attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  const body = (await request.json()) as ContactPayload;
  const name = sanitizeMessage(body.name ?? '');
  const email = body.email?.trim().toLowerCase() ?? '';
  const message = sanitizeMessage(body.message ?? '');
  const honeypot = body.honeypot?.trim() ?? '';
  const fingerprint = body.fingerprint?.trim() ?? '';

  // Honeypot: pretend success for bots.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Enter a valid name.' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!message || message.length > 2000) {
    return NextResponse.json({ error: 'Enter a valid message.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    name,
    email,
    message,
    ip_hash: hashValue(ip),
    fingerprint_hash: fingerprint ? hashValue(fingerprint) : null
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
