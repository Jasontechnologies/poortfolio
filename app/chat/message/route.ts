import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, isLikelyUrl, sanitizeMessage } from '@/lib/security/abuse';
import { CHAT_RATE_LIMITS, CHAT_MESSAGE_COOLDOWN_SECONDS } from '@/lib/security/policies';
import { verifyTurnstileToken } from '@/lib/security/turnstile';
import { consumeDbRateLimit, resetDbRateLimit } from '@/lib/security/rate-limit-db';
import { isFeatureEnabled } from '@/lib/supabase/feature-flags';

type ChatAttachment = {
  path: string;
  url: string;
  type: string;
  size: number;
  name: string;
};

type ChatPayload = {
  message?: string;
  captchaToken?: string;
  fingerprint?: string;
  attachments?: ChatAttachment[];
};

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = (await request.json()) as ChatPayload;
  const message = sanitizeMessage(body.message ?? '');
  const captchaToken = body.captchaToken?.trim() ?? '';
  const fingerprint = body.fingerprint?.trim() ?? '';
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) : [];

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  if (message.length > 1200) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  }

  for (const attachment of attachments) {
    if (!attachment.path || !attachment.type || !attachment.name || !attachment.url) {
      return NextResponse.json({ error: 'Invalid attachment payload.' }, { status: 400 });
    }
    if (attachment.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json({ error: 'Attachment exceeds 5MB limit.' }, { status: 400 });
    }
  }

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Your account is restricted. Contact support.' }, { status: 403 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Verify your email before sending chat messages.' },
      { status: 403 }
    );
  }

  const userRateKey = `chat:user:${user.id}`;
  const ipRateKey = `chat:ip:${ip}`;
  const userMinuteLimit = await consumeDbRateLimit({
    supabase,
    rateKey: userRateKey,
    bucket: CHAT_RATE_LIMITS.userMinute.bucket,
    limit: CHAT_RATE_LIMITS.userMinute.limit,
    windowSeconds: CHAT_RATE_LIMITS.userMinute.windowSeconds
  });
  const ipMinuteLimit = await consumeDbRateLimit({
    supabase,
    rateKey: ipRateKey,
    bucket: CHAT_RATE_LIMITS.ipMinute.bucket,
    limit: CHAT_RATE_LIMITS.ipMinute.limit,
    windowSeconds: CHAT_RATE_LIMITS.ipMinute.windowSeconds
  });
  const exceeded = !userMinuteLimit.allowed || !ipMinuteLimit.allowed;

  if (exceeded) {
    const abuseLimit = await consumeDbRateLimit({
      supabase,
      rateKey: ipRateKey,
      bucket: CHAT_RATE_LIMITS.abuse.bucket,
      limit: CHAT_RATE_LIMITS.abuse.limit,
      windowSeconds: CHAT_RATE_LIMITS.abuse.windowSeconds
    });

    if (abuseLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please slow down.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(userMinuteLimit.retryAfterSeconds, ipMinuteLimit.retryAfterSeconds))
          }
        }
      );
    }

    const { data: existingAbuse } = await supabase
      .from('abuse_events')
      .select('id,count,window_reset_at')
      .eq('user_id', user.id)
      .eq('type', 'chat_rate_limit')
      .maybeSingle();

    const now = new Date();
    const withinWindow =
      existingAbuse?.window_reset_at && new Date(existingAbuse.window_reset_at).getTime() > now.getTime();
    const nextAbuseCount = withinWindow ? (existingAbuse?.count ?? 0) + 1 : 1;
    const nextWindowResetAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    if (existingAbuse?.id) {
      await supabase
        .from('abuse_events')
        .update({
          count: nextAbuseCount,
          window_reset_at: nextWindowResetAt
        })
        .eq('id', existingAbuse.id);
    } else {
      await supabase.from('abuse_events').insert({
        ip,
        user_id: user.id,
        type: 'chat_rate_limit',
        count: nextAbuseCount,
        window_reset_at: nextWindowResetAt
      });
    }

    if (nextAbuseCount >= 5) {
      await supabase.from('profiles').update({ is_banned: true }).eq('id', user.id);
      return NextResponse.json(
        {
          error: 'Account temporarily restricted due to repeated abuse. Contact support.'
        },
        { status: 403 }
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        {
          error: 'Verification challenge required due to repeated chat abuse.',
          captchaRequired: true
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(userMinuteLimit.retryAfterSeconds, ipMinuteLimit.retryAfterSeconds))
          }
        }
      );
    }

    const verification = await verifyTurnstileToken({
      token: captchaToken,
      remoteIp: ip
    });

    if (!verification.success) {
      return NextResponse.json(
        {
          error: 'CAPTCHA verification failed.',
          captchaRequired: true
        },
        { status: 403 }
      );
    }

    await resetDbRateLimit({
      supabase,
      rateKey: ipRateKey,
      bucket: CHAT_RATE_LIMITS.abuse.bucket,
      limit: CHAT_RATE_LIMITS.abuse.limit,
      windowSeconds: CHAT_RATE_LIMITS.abuse.windowSeconds
    });
  }

  const { count: existingMessageCount, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('sender_role', 'user');

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((existingMessageCount ?? 0) === 0 && isLikelyUrl(message)) {
    return NextResponse.json(
      { error: 'Links are blocked in your first message. Send a plain-text intro first.' },
      { status: 400 }
    );
  }

  const { data: lastMessage, error: lastMessageError } = await supabase
    .from('messages')
    .select('created_at')
    .eq('sender_id', user.id)
    .eq('sender_role', 'user')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastMessageError) {
    return NextResponse.json({ error: lastMessageError.message }, { status: 400 });
  }

  if (lastMessage?.created_at) {
    const secondsSinceLastMessage =
      (Date.now() - new Date(lastMessage.created_at).getTime()) / 1000;
    if (secondsSinceLastMessage < CHAT_MESSAGE_COOLDOWN_SECONDS) {
      return NextResponse.json(
        {
          error: `Please wait ${CHAT_MESSAGE_COOLDOWN_SECONDS} seconds between messages.`
        },
        { status: 429, headers: { 'Retry-After': String(CHAT_MESSAGE_COOLDOWN_SECONDS) } }
      );
    }
  }

  const { data: openConversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id,unread_count_admin')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 400 });
  }

  let conversationId = openConversation?.id;
  if (!conversationId) {
    const { data: createdConversation, error: conversationCreateError } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, status: 'open' })
      .select('id')
      .single();

    if (conversationCreateError) {
      return NextResponse.json({ error: conversationCreateError.message }, { status: 400 });
    }

    conversationId = createdConversation.id;
  }

  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_role: 'user',
    sender_id: user.id,
    body: message,
    attachments
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: message.slice(0, 160),
      unread_count_admin: (openConversation?.unread_count_admin ?? 0) + 1,
      unread_count_user: 0,
      status: 'open'
    })
    .eq('id', conversationId);

  if (fingerprint) {
    const clientId = fingerprint.split('|').pop() ?? fingerprint;
    await supabase.from('user_devices').upsert(
      {
        user_id: user.id,
        client_id: clientId,
        user_agent: request.headers.get('user-agent') ?? null,
        platform: request.headers.get('sec-ch-ua-platform') ?? null,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: 'user_id,client_id' }
    );
  }

  await supabase.from('notifications_outbox').insert({
    to_email: 'support@koolaai.com',
    subject: 'New support chat message',
    body: `Conversation ${conversationId} received a new user message.`,
    metadata: {
      conversationId,
      senderRole: 'user',
      senderId: user.id
    }
  });

  return NextResponse.json({ ok: true, conversationId });
}
