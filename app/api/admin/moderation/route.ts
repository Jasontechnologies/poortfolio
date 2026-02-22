import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireContentOpsApi } from '@/lib/supabase/guards';

type ModerationPayload = {
  id?: string;
  status?: 'pending' | 'approved' | 'rejected';
};

export async function GET(request: NextRequest) {
  const guard = await requireContentOpsApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const statusFilter = request.nextUrl.searchParams.get('status');
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '20')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('moderation_items')
    .select('id,type,status,payload,created_at,reviewed_at,reviewed_by', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    items: data ?? [],
    pagination: {
      page,
      pageSize,
      total: count ?? 0
    }
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireContentOpsApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as ModerationPayload;
  const id = body.id?.trim();

  if (!id || !body.status) {
    return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('moderation_items')
    .update({
      status: body.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: authContext.user.id
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'moderation.reviewed',
    actionType: 'moderation.reviewed',
    targetTable: 'moderation_items',
    targetId: id,
    details: { status: body.status }
  });

  return NextResponse.json({ ok: true });
}
