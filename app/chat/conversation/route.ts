import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/supabase/feature-flags';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const isChatEnabled = await isFeatureEnabled('chat_enabled', supabase);
  if (!isChatEnabled) {
    return NextResponse.json({ error: 'Chat is temporarily unavailable.' }, { status: 503 });
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '20')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id,status,last_message_at,last_message_preview,unread_count_user,unread_count_admin,assigned_to,created_at,updated_at')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 400 });
  }

  if (!conversation) {
    return NextResponse.json({
      conversation: null,
      messages: [],
      pagination: {
        page,
        pageSize,
        total: 0
      }
    });
  }

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversation.id)
    .eq('sender_role', 'admin')
    .is('read_at', null);

  await supabase
    .from('conversations')
    .update({ unread_count_user: 0 })
    .eq('id', conversation.id);

  const { data: messages, error: messageError, count } = await supabase
    .from('messages')
    .select('id,sender_role,sender_id,body,attachments,created_at,read_at', { count: 'exact' })
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 400 });
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
