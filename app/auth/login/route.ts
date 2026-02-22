import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LOGIN_FAILURE_RATE_LIMIT } from '@/lib/security/policies';
import { getClientIp, isValidEmail } from '@/lib/security/abuse';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { consumeDbRateLimit, peekDbRateLimit, resetDbRateLimit } from '@/lib/security/rate-limit-db';

type LoginPayload = {
  email?: string;
  password?: string;
  captchaToken?: string;
  fingerprint?: string;
};

type ProfileRole = 'user' | 'support_agent' | 'admin' | 'super_admin';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = (await request.json()) as LoginPayload;
  const captchaToken = body.captchaToken?.trim() ?? '';
  const fingerprint = body.fingerprint?.trim() ?? '';
  const supabase = await createClient();
  const rateKey = `login:ip:${ip}`;
  const failureWindow = await peekDbRateLimit({
    supabase,
    rateKey,
    bucket: LOGIN_FAILURE_RATE_LIMIT.bucket,
    limit: LOGIN_FAILURE_RATE_LIMIT.limit,
    windowSeconds: LOGIN_FAILURE_RATE_LIMIT.windowSeconds
  });
  const needsCaptcha = !failureWindow.allowed;

  if (needsCaptcha && !captchaToken) {
    return NextResponse.json(
      {
        error: 'Too many failed login attempts. Complete CAPTCHA to continue.',
        captchaRequired: true
      },
      {
        status: 429,
        headers: { 'Retry-After': String(failureWindow.retryAfterSeconds) }
      }
    );
  }

  if (needsCaptcha && captchaToken) {
    const verification = await verifyTurnstileToken({
      token: captchaToken,
      remoteIp: ip
    });

    if (!verification.success) {
      return NextResponse.json(
        {
          error: 'CAPTCHA verification failed.',
          captchaRequired: true
        },
        { status: 403 }
      );
    }
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password?.trim() ?? '';

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const failureAfterAttempt = await consumeDbRateLimit({
      supabase,
      rateKey,
      bucket: LOGIN_FAILURE_RATE_LIMIT.bucket,
      limit: LOGIN_FAILURE_RATE_LIMIT.limit,
      windowSeconds: LOGIN_FAILURE_RATE_LIMIT.windowSeconds
    });
    return NextResponse.json(
      {
        error: error.message,
        captchaRequired: !failureAfterAttempt.allowed
      },
      { status: 401 }
    );
  }

  await resetDbRateLimit({
    supabase,
    rateKey,
    bucket: LOGIN_FAILURE_RATE_LIMIT.bucket,
    limit: LOGIN_FAILURE_RATE_LIMIT.limit,
    windowSeconds: LOGIN_FAILURE_RATE_LIMIT.windowSeconds
  });

  if (data.user && fingerprint) {
    const clientId = fingerprint.split('|').pop() ?? fingerprint;
    await supabase.from('profiles').update({ client_id: clientId }).eq('id', data.user.id);
    await supabase.from('user_devices').upsert(
      {
        user_id: data.user.id,
        client_id: clientId,
        user_agent: request.headers.get('user-agent') ?? null,
        platform: request.headers.get('sec-ch-ua-platform') ?? null,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: 'user_id,client_id' }
    );
  }

  let role: ProfileRole = 'user';
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (
      profile?.role === 'user' ||
      profile?.role === 'support_agent' ||
      profile?.role === 'admin' ||
      profile?.role === 'super_admin'
    ) {
      role = profile.role;
    }
  }

  return NextResponse.json({
    ok: true,
    role,
    emailVerified: Boolean(data.user?.email_confirmed_at),
    message: 'Signed in successfully.'
  });
}
