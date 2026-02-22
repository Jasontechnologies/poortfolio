import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AUTH_REFRESH_USER_LIMITS } from '@/lib/security/policies';
import { enforceRateLimits } from '@/lib/security/rate-limit';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const userLimit = enforceRateLimits(`auth:refresh:user:${user.id}`, AUTH_REFRESH_USER_LIMITS);
  if (!userLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many refresh attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(userLimit.retryAfterSeconds) } }
    );
  }

  const { error } = await supabase.auth.refreshSession();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
