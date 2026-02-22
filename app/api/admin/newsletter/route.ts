import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSuperAdminApi } from '@/lib/supabase/guards';

type NewsletterUpdatePayload = {
  id?: string;
  status?: 'active' | 'unsubscribed';
};

export async function GET(request: NextRequest) {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '25')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('newsletter_subscribers')
    .select('id,email,status,created_at,updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    subscribers: data ?? [],
    pagination: {
      page,
      pageSize,
      total: count ?? 0
    }
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as NewsletterUpdatePayload;
  const id = body.id?.trim();
  const status = body.status;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
  }

  const { error } = await supabase.from('newsletter_subscribers').update({ status }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'newsletter.updated',
    targetTable: 'newsletter_subscribers',
    targetId: id,
    details: { status }
  });

  return NextResponse.json({ ok: true });
}
