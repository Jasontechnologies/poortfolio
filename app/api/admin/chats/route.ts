import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSupportApi } from '@/lib/supabase/guards';

type ConversationUpdatePayload = {
  id?: string;
  status?: 'open' | 'closed';
  assigned_to?: string | null;
};

export async function GET(request: NextRequest) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '20')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: conversations, error, count } = await supabase
    .from('conversations')
    .select('id,user_id,status,assigned_to,last_message_at,last_message_preview,unread_count_user,unread_count_admin,created_at,updated_at', { count: 'exact' })
    .order('last_message_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userIds = [...new Set((conversations ?? []).map((conversation) => conversation.user_id))];
  const profileMap = new Map<string, { full_name: string | null; role: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,role')
      .in('id', userIds);

    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, { full_name: profile.full_name, role: profile.role });
    }
  }

  const items = (conversations ?? []).map((conversation) => ({
    ...conversation,
    profile: profileMap.get(conversation.user_id) ?? null
  }));

  return NextResponse.json({
    currentUserId: authContext.user.id,
    conversations: items,
    pagination: {
      page,
      pageSize,
      total: count ?? 0
    }
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as ConversationUpdatePayload;
  const id = body.id?.trim();
  const status = body.status ?? null;

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (status) updatePayload.status = status;
  if (Object.prototype.hasOwnProperty.call(body, 'assigned_to')) {
    updatePayload.assigned_to = body.assigned_to;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { error } = await supabase.from('conversations').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'conversation.updated',
    actionType: 'conversation.updated',
    targetTable: 'conversations',
    targetId: id,
    details: updatePayload
  });

  return NextResponse.json({ ok: true });
}
