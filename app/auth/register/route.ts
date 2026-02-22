import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SIGNUP_RATE_LIMITS } from '@/lib/security/policies';
import { getClientIp, hashValue, isDisposableEmail, isValidEmail } from '@/lib/security/abuse';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { consumeDbRateLimit, resetDbRateLimit } from '@/lib/security/rate-limit-db';
import { isFeatureEnabled } from '@/lib/supabase/feature-flags';

type RegisterPayload = {
  email?: string;
  password?: string;
  honeypot?: string;
  fingerprint?: string;
  captchaToken?: string;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = (await request.json()) as RegisterPayload;
  const captchaToken = body.captchaToken?.trim() ?? '';
  const supabase = await createClient();
  const isSignupEnabled = await isFeatureEnabled('signup_enabled', supabase);
  if (!isSignupEnabled) {
    return NextResponse.json({ error: 'Signup is temporarily disabled.' }, { status: 503 });
  }
  const rateKey = `signup:ip:${ip}`;
  const minuteLimit = await consumeDbRateLimit({
    supabase,
    rateKey,
    bucket: SIGNUP_RATE_LIMITS.minute.bucket,
    limit: SIGNUP_RATE_LIMITS.minute.limit,
    windowSeconds: SIGNUP_RATE_LIMITS.minute.windowSeconds
  });
  const hourLimit = await consumeDbRateLimit({
    supabase,
    rateKey,
    bucket: SIGNUP_RATE_LIMITS.hour.bucket,
    limit: SIGNUP_RATE_LIMITS.hour.limit,
    windowSeconds: SIGNUP_RATE_LIMITS.hour.windowSeconds
  });
  const needsCaptcha = !minuteLimit.allowed || !hourLimit.allowed;

  if (needsCaptcha && !captchaToken) {
    return NextResponse.json(
      {
        error: 'Signup limit reached. Complete CAPTCHA to continue.',
        captchaRequired: true
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(minuteLimit.retryAfterSeconds, hourLimit.retryAfterSeconds))
        }
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

    await resetDbRateLimit({
      supabase,
      rateKey,
      bucket: SIGNUP_RATE_LIMITS.minute.bucket,
      limit: SIGNUP_RATE_LIMITS.minute.limit,
      windowSeconds: SIGNUP_RATE_LIMITS.minute.windowSeconds
    });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password?.trim() ?? '';
  const honeypot = body.honeypot?.trim() ?? '';

  // Honeypot: bots should receive a generic success response.
  if (honeypot) {
    return NextResponse.json({ ok: true, requiresEmailVerification: true });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: 'Disposable email addresses are not allowed. Use a permanent email.' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const userFingerprint = body.fingerprint?.trim();
  const userAgent = request.headers.get('user-agent') ?? 'unknown-user-agent';
  const fingerprintHash = hashValue(`${userAgent}|${userFingerprint || 'no-client-fingerprint'}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        signup_fingerprint_hash: fingerprintHash,
        signup_ip_hash: hashValue(ip)
      }
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user && userFingerprint) {
    const clientId = userFingerprint.split('|').pop() ?? userFingerprint;
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

  return NextResponse.json({
    ok: true,
    requiresEmailVerification: !data.session,
    emailVerified: Boolean(data.user?.email_confirmed_at),
    message: data.session
      ? 'Account created successfully.'
      : 'Account created. Check your email to verify before using chat.'
  });
}
