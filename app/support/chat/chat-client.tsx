'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { TurnstileChallenge } from '@/components/security/turnstile-challenge';
import { ChatPwa } from '@/components/support/chat-pwa';
import { getClientFingerprint } from '@/lib/client/fingerprint';

type Attachment = {
  path: string;
  url: string;
  type: string;
  size: number;
  name: string;
};

type Conversation = {
  id: string;
  status: 'open' | 'closed';
  unread_count_user: number;
  unread_count_admin: number;
  last_message_at: string;
  created_at: string;
};

type Message = {
  id: string;
  sender_role: 'user' | 'admin';
  sender_id: string;
  body: string;
  attachments?: Attachment[];
  created_at: string;
  read_at: string | null;
};

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [flagsReady, setFlagsReady] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadConversation = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/chat/conversation?page=${nextPage}&pageSize=${pageSize}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as {
        error?: string;
        conversation?: Conversation | null;
        messages?: Message[];
        pagination?: { page: number; total: number };
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load conversation.');
        return;
      }

      setConversation(payload.conversation ?? null);
      setMessages(payload.messages ?? []);
      setPage(payload.pagination?.page ?? nextPage);
      setTotal(payload.pagination?.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversation(1);
  }, [loadConversation]);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags', { cache: 'no-store' });
        const payload = (await response.json()) as { flags?: { chat_enabled?: boolean } };
        setChatEnabled(payload.flags?.chat_enabled !== false);
      } finally {
        setFlagsReady(true);
      }
    };
    void loadFlags();
  }, []);

  const uploadAttachment = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Files must be 5MB or smaller.');
      return;
    }

    setIsUploading(true);
    setStatus('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/chat/attachments', {
        method: 'POST',
        body: formData
      });
      const payload = (await response.json()) as {
        error?: string;
        attachment?: Attachment;
      };
      const uploadedAttachment = payload.attachment;

      if (!response.ok || !uploadedAttachment) {
        setStatus(payload.error ?? 'Unable to upload attachment.');
        return;
      }

      setAttachments((prev) => [...prev, uploadedAttachment]);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (captchaToken?: string) => {
    if (flagsReady && !chatEnabled) {
      setStatus('Chat is temporarily unavailable.');
      return;
    }

    setIsSending(true);
    setStatus('');
    try {
      const response = await fetch('/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          attachments,
          fingerprint: getClientFingerprint(),
          captchaToken
        })
      });
      const payload = (await response.json()) as { error?: string; captchaRequired?: boolean };

      if (!response.ok) {
        if (payload.captchaRequired) {
          setCaptchaRequired(true);
          setStatus('Verification required. Complete CAPTCHA to continue.');
          return;
        }

        setStatus(payload.error ?? 'Unable to send message.');
        return;
      }

      setCaptchaRequired(false);
      setStatus('Message sent.');
      setMessage('');
      setAttachments([]);
      await loadConversation(1);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage();
  };

  return (
    <section className="space-y-6 py-4">
      <article className="card max-w-3xl">
        <ChatPwa />
        <h1 className="text-3xl font-bold">Private support chat</h1>
        <p className="mt-2 text-black/70">
          Start a private conversation with the support team for Koola AI and account issues.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" type="submit" form="support-chat-form" disabled={isSending || isUploading || (flagsReady && !chatEnabled)}>
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
          <Link href="/support/complaints/new" className="btn-subtle">Submit Product Complaint</Link>
        </div>

        {flagsReady && !chatEnabled ? (
          <article className="mt-4 rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-sm text-black/70">Chat is temporarily unavailable.</p>
          </article>
        ) : null}

        <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3">
          {isLoading ? (
            <p className="text-sm text-black/60">Loading conversation...</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.1em] text-black/50">
                {conversation ? `Conversation ${conversation.status}` : 'No conversation yet'}
              </p>
              <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-black/10 bg-white p-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-black/60">No messages yet. Send one to start your thread.</p>
                ) : null}
                {messages.map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      chatMessage.sender_role === 'user'
                        ? 'ml-auto bg-[#dff4be] text-[#172109]'
                        : 'bg-[#eef1f7] text-[#202943]'
                    }`}
                  >
                    <p>{chatMessage.body}</p>
                    {chatMessage.attachments && chatMessage.attachments.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {chatMessage.attachments.map((attachment) => (
                          <a
                            key={attachment.path}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="block text-xs underline underline-offset-4"
                          >
                            {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1 text-[11px] opacity-70">
                      {chatMessage.sender_role} | {new Date(chatMessage.created_at).toLocaleString()}
                      {chatMessage.sender_role === 'user'
                        ? chatMessage.read_at
                          ? ` | Read ${new Date(chatMessage.read_at).toLocaleString()}`
                          : ' | Sent'
                        : ''}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={page <= 1 || isLoading}
                  onClick={() => void loadConversation(page - 1)}
                >
                  Prev
                </button>
                <span className="text-xs text-black/65">
                  {page}/{totalPages}
                </span>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => void loadConversation(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <form id="support-chat-form" onSubmit={onSubmit} className="mt-6 space-y-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSending || (flagsReady && !chatEnabled)}
            required
            className="min-h-32 w-full rounded-lg border border-black/20 p-3"
            placeholder="Type your message..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,text/plain,application/json,application/zip,application/x-zip-compressed"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void uploadAttachment(file);
                event.currentTarget.value = '';
              }}
              className="max-w-full text-sm"
              disabled={isSending || isUploading || (flagsReady && !chatEnabled)}
            />
            {isUploading ? <span className="text-xs text-black/60">Uploading...</span> : null}
          </div>
          {attachments.length > 0 ? (
            <div className="rounded-lg border border-black/10 bg-white/70 p-2 text-xs text-black/65">
              {attachments.map((attachment) => (
                <p key={attachment.path}>
                  {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                </p>
              ))}
            </div>
          ) : null}
          {captchaRequired ? (
            <TurnstileChallenge
              onToken={(token) => {
                void sendMessage(token);
              }}
              onError={() => setStatus('Unable to initialize CAPTCHA. Refresh and try again.')}
            />
          ) : null}
          {status ? <p className="text-sm text-black/70">{status}</p> : null}
        </form>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Private by default</h2>
        <p className="mt-3 text-black/70">
          Your conversation content is private by default and visible only to authorized support roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/account/privacy" className="btn-subtle">Open Privacy Controls</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Professional use only</h2>
        <p className="mt-3 text-black/70">
          Support chat is for users 18+ and must follow the Acceptable Use Policy.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/acceptable-use" className="btn-subtle">Read Acceptable Use</Link>
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
        </div>
      </article>
    </section>
  );
}
