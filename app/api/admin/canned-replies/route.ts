import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSupportApi } from '@/lib/supabase/guards';

type CannedReplyPayload = {
  id?: string;
  title?: string;
  body?: string;
};

export async function GET() {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const { data, error } = await supabase
    .from('canned_replies')
    .select('id,title,body,created_at,updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ replies: data ?? [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as CannedReplyPayload;
  const title = body.title?.trim();
  const replyBody = body.body?.trim();

  if (!title || !replyBody) {
    return NextResponse.json({ error: 'title and body are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('canned_replies')
    .insert({
      title,
      body: replyBody,
      created_by: authContext.user.id,
      updated_by: authContext.user.id
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'canned_reply.created',
    actionType: 'canned_reply.created',
    targetTable: 'canned_replies',
    targetId: data.id,
    details: { title }
  });

  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as CannedReplyPayload;
  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    updated_by: authContext.user.id
  };
  if (body.title) payload.title = body.title.trim();
  if (body.body) payload.body = body.body.trim();

  const { error } = await supabase.from('canned_replies').update(payload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'canned_reply.updated',
    actionType: 'canned_reply.updated',
    targetTable: 'canned_replies',
    targetId: id,
    details: payload
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('canned_replies').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'canned_reply.deleted',
    actionType: 'canned_reply.deleted',
    targetTable: 'canned_replies',
    targetId: id
  });

  return NextResponse.json({ ok: true });
}
