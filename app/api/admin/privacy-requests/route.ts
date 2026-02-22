import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSuperAdminApi } from '@/lib/supabase/guards';

type PrivacyAdminPayload = {
  id?: string;
  status?: 'pending' | 'in_review' | 'completed' | 'rejected';
  notes?: string;
};

export async function GET(request: NextRequest) {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '20')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('privacy_requests')
    .select('id,user_id,type,status,notes,processed_by,created_at,updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    requests: data ?? [],
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
  const body = (await request.json()) as PrivacyAdminPayload;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    processed_by: authContext.user.id
  };
  if (body.status) updatePayload.status = body.status;
  if (typeof body.notes === 'string') updatePayload.notes = body.notes.trim() || null;

  const { error } = await supabase.from('privacy_requests').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'privacy_request.updated',
    actionType: 'privacy_request.updated',
    targetTable: 'privacy_requests',
    targetId: id,
    details: updatePayload
  });

  return NextResponse.json({ ok: true });
}
