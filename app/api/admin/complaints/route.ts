import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSuperAdminApi } from '@/lib/supabase/guards';

type ComplaintAdminPayload = {
  id?: string;
  status?: 'new' | 'in_review' | 'resolved';
  priority?: 'low' | 'medium' | 'high';
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
    .from('complaints')
    .select('id,user_id,reporter_name,reporter_email,complaint_type,title,details,urls,status,priority,source,created_at', {
      count: 'exact'
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    complaints: data ?? [],
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
  const body = (await request.json()) as ComplaintAdminPayload;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.status) payload.status = body.status;
  if (body.priority) payload.priority = body.priority;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No updates were provided.' }, { status: 400 });
  }

  const { error } = await supabase.from('complaints').update(payload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'complaint.updated',
    actionType: 'complaint.updated',
    targetTable: 'complaints',
    targetId: id,
    details: payload
  });

  return NextResponse.json({ ok: true });
}
