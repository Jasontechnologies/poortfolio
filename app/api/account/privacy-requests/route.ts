import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PrivacyRequestPayload = {
  type?: 'export' | 'delete';
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('privacy_requests')
    .select('id,type,status,notes,created_at,updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const body = (await request.json()) as PrivacyRequestPayload;
  if (!body.type || !['export', 'delete'].includes(body.type)) {
    return NextResponse.json({ error: 'type must be export or delete.' }, { status: 400 });
  }

  const { error } = await supabase.from('privacy_requests').insert({
    user_id: user.id,
    type: body.type
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
