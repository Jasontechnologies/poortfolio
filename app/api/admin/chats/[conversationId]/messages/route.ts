import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSupportApi } from '@/lib/supabase/guards';

type Params = {
  conversationId: string;
};

type ReplyPayload = {
  body?: string;
  attachments?: Array<{
    path: string;
    url: string;
    type: string;
    size: number;
    name: string;
  }>;
};

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const conversationId = context.params.conversationId;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '30')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id,user_id,status,last_message_at,last_message_preview,unread_count_user,unread_count_admin,assigned_to,created_at,updated_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 400 });
  }

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_role', 'user')
    .is('read_at', null);

  await supabase
    .from('conversations')
    .update({ unread_count_admin: 0 })
    .eq('id', conversationId);

  const { data: messages, error: messagesError, count } = await supabase
    .from('messages')
    .select('id,sender_role,sender_id,body,attachments,created_at,read_at', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 400 });
  }

  return NextResponse.json({
    conversation,
    messages: (messages ?? []).reverse(),
    pagination: {
      page,
      pageSize,
      total: count ?? 0
    }
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Params }
) {
  const guard = await requireSupportApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const conversationId = context.params.conversationId;
  const body = (await request.json()) as ReplyPayload;
  const messageBody = body.body?.trim() ?? '';
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) : [];

  if (!messageBody) {
    return NextResponse.json({ error: 'body is required.' }, { status: 400 });
  }

  for (const attachment of attachments) {
    if (!attachment.path || !attachment.type || !attachment.name || !attachment.url) {
      return NextResponse.json({ error: 'Invalid attachment payload.' }, { status: 400 });
    }
    if (attachment.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json({ error: 'Attachment exceeds 5MB limit.' }, { status: 400 });
    }
  }

  const { data: conversation, error: conversationLookupError } = await supabase
    .from('conversations')
    .select('id,user_id,unread_count_user')
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationLookupError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_role: 'admin',
    sender_id: authContext.user.id,
    body: messageBody,
    attachments
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { error: updateConversationError } = await supabase
    .from('conversations')
    .update({
      status: 'open',
      last_message_at: new Date().toISOString(),
      last_message_preview: messageBody.slice(0, 160),
      unread_count_user: (conversation.unread_count_user ?? 0) + 1,
      unread_count_admin: 0
    })
    .eq('id', conversationId);

  if (updateConversationError) {
    return NextResponse.json({ error: updateConversationError.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'conversation.replied',
    actionType: 'conversation.replied',
    targetTable: 'conversations',
    targetId: conversationId
  });

  await supabase.from('notifications_outbox').insert({
    to_email: 'user-notification@placeholder.local',
    subject: 'Support replied to your conversation',
    body: `Conversation ${conversationId} has a new admin reply.`,
    metadata: {
      conversationId,
      recipientUserId: conversation.user_id,
      senderRole: 'admin',
      senderId: authContext.user.id
    }
  });

  return NextResponse.json({ ok: true });
}
