import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, sanitizeMessage } from '@/lib/security/abuse';
import { COMPLAINT_CREATE_IP_LIMITS, COMPLAINT_CREATE_USER_LIMITS } from '@/lib/security/policies';
import { enforceRateLimits } from '@/lib/security/rate-limit';

type ComplaintPayload = {
  title?: string;
  details?: string;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = enforceRateLimits(`complaint:create:ip:${ip}`, COMPLAINT_CREATE_IP_LIMITS);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many complaint submissions from this IP. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  const body = (await request.json()) as ComplaintPayload;
  const title = sanitizeMessage(body.title ?? '');
  const details = sanitizeMessage(body.details ?? '');

  if (!title || title.length > 160) {
    return NextResponse.json({ error: 'Enter a valid complaint title.' }, { status: 400 });
  }

  if (!details || details.length > 2500) {
    return NextResponse.json({ error: 'Enter valid complaint details.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Verify your email before submitting complaints.' },
      { status: 403 }
    );
  }

  const userLimit = enforceRateLimits(`complaint:create:user:${user.id}`, COMPLAINT_CREATE_USER_LIMITS);
  if (!userLimit.allowed) {
    return NextResponse.json(
      { error: 'You have reached the complaint submission limit. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(userLimit.retryAfterSeconds) } }
    );
  }

  const { error } = await supabase.from('complaints').insert({
    user_id: user.id,
    title,
    details,
    status: 'new',
    priority: 'medium'
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
