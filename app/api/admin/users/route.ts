import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSuperAdminApi } from '@/lib/supabase/guards';

type UserUpdatePayload = {
  id?: string;
  role?: 'user' | 'support_agent' | 'admin' | 'super_admin';
  is_banned?: boolean;
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
    .from('profiles')
    .select('id,full_name,role,is_banned,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (request.nextUrl.searchParams.get('export') === 'csv') {
    const headers = ['id', 'full_name', 'role', 'is_banned', 'created_at'];
    const csvRows = (data ?? []).map((row) =>
      [row.id, row.full_name ?? '', row.role ?? '', String(Boolean(row.is_banned)), row.created_at]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
    await logAuditEvent(supabase, {
      actorId: guard.authContext.user.id,
      actorRole: guard.authContext.role,
      action: 'users.exported',
      actionType: 'users.exported',
      targetTable: 'profiles',
      details: {
        count: data?.length ?? 0
      }
    });
    return new NextResponse([headers.join(','), ...csvRows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users.csv"'
      }
    });
  }

  return NextResponse.json({
    users: data ?? [],
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
  const body = (await request.json()) as UserUpdatePayload;
  const id = body.id?.trim();
  const role = body.role;
  const hasBanUpdate = typeof body.is_banned === 'boolean';

  if (!id || (!role && !hasBanUpdate)) {
    return NextResponse.json({ error: 'id and at least one field are required.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (role) updatePayload.role = role;
  if (hasBanUpdate) updatePayload.is_banned = body.is_banned;

  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: hasBanUpdate ? 'profile.updated' : 'profile.role_updated',
    actionType: hasBanUpdate
      ? body.is_banned
        ? 'profile.banned'
        : 'profile.unbanned'
      : 'profile.role_updated',
    targetTable: 'profiles',
    targetId: id,
    details: updatePayload
  });

  return NextResponse.json({ ok: true });
}
