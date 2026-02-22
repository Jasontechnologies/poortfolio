import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, isValidEmail, sanitizeMessage } from '@/lib/security/abuse';
import { COMPLAINT_CREATE_IP_LIMITS } from '@/lib/security/policies';
import { enforceRateLimits } from '@/lib/security/rate-limit';

type ComplaintPayload = {
  name?: string;
  email?: string;
  complaint_type?: string;
  description?: string;
  urls?: string;
};

function parseUrls(input: string) {
  return input
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = enforceRateLimits(`complaint:public:ip:${ip}`, COMPLAINT_CREATE_IP_LIMITS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many complaints from this IP. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const body = (await request.json()) as ComplaintPayload;
  const name = sanitizeMessage(body.name ?? '');
  const email = body.email?.trim().toLowerCase() ?? '';
  const complaintType = sanitizeMessage(body.complaint_type ?? '');
  const description = sanitizeMessage(body.description ?? '');
  const urls = parseUrls(body.urls ?? '');

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Enter a valid name.' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!complaintType || complaintType.length > 120) {
    return NextResponse.json({ error: 'Select a complaint type.' }, { status: 400 });
  }

  if (!description || description.length > 3000) {
    return NextResponse.json({ error: 'Enter a valid description.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('complaints').insert({
    user_id: null,
    title: complaintType,
    details: description,
    complaint_type: complaintType,
    reporter_name: name,
    reporter_email: email,
    urls,
    source: 'public_form'
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
