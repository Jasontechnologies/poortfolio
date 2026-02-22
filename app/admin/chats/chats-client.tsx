'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Attachment = {
  path: string;
  url: string;
  type: string;
  size: number;
  name: string;
};

type ConversationRow = {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  assigned_to: string | null;
  unread_count_admin: number;
  unread_count_user: number;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  profile: {
    full_name: string | null;
    role: string;
  } | null;
};

type MessageRow = {
  id: string;
  sender_role: 'user' | 'admin';
  sender_id: string;
  body: string;
  attachments?: Attachment[];
  created_at: string;
  read_at: string | null;
};

type CannedReply = {
  id: string;
  title: string;
  body: string;
};

export function AdminChatsClient() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationTotal, setConversationTotal] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messageTotal, setMessageTotal] = useState(0);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [status, setStatus] = useState('');
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const conversationPageSize = 20;
  const messagePageSize = 30;
  const conversationTotalPages = Math.max(1, Math.ceil(conversationTotal / conversationPageSize));
  const messageTotalPages = Math.max(1, Math.ceil(messageTotal / messagePageSize));

  const loadCannedReplies = useCallback(async () => {
    const response = await fetch('/api/admin/canned-replies', { cache: 'no-store' });
    const payload = (await response.json()) as { replies?: CannedReply[] };
    if (response.ok) {
      setCannedReplies(payload.replies ?? []);
    }
  }, []);

  const loadConversations = useCallback(async (nextPage: number) => {
    setLoadingConversations(true);
    try {
      const response = await fetch(
        `/api/admin/chats?page=${nextPage}&pageSize=${conversationPageSize}`,
        { cache: 'no-store' }
      );
      const payload = (await response.json()) as {
        error?: string;
        currentUserId?: string;
        conversations?: ConversationRow[];
        pagination?: { page: number; total: number };
      };
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load conversations.');
        return;
      }

      const nextConversations = payload.conversations ?? [];
      setConversations(nextConversations);
      setConversationTotal(payload.pagination?.total ?? 0);
      setConversationPage(payload.pagination?.page ?? nextPage);
      setCurrentUserId(payload.currentUserId ?? null);

      if (!selectedConversationId && nextConversations.length > 0) {
        setSelectedConversationId(nextConversations[0].id);
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [selectedConversationId]);

  const loadMessages = useCallback(async (conversationId: string, nextPage: number) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/admin/chats/${conversationId}/messages?page=${nextPage}&pageSize=${messagePageSize}`,
        { cache: 'no-store' }
      );
      const payload = (await response.json()) as {
        error?: string;
        messages?: MessageRow[];
        pagination?: { page: number; total: number };
      };
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load messages.');
        return;
      }

      setMessages(payload.messages ?? []);
      setMessageTotal(payload.pagination?.total ?? 0);
      setMessagePage(payload.pagination?.page ?? nextPage);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations(1);
    void loadCannedReplies();
  }, [loadConversations, loadCannedReplies]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId, 1);
  }, [selectedConversationId, loadMessages]);

  const uploadAttachment = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Files must be 5MB or smaller.');
      return;
    }

    setUploadingAttachment(true);
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

      setReplyAttachments((prev) => [...prev, uploadedAttachment]);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedConversationId || !reply.trim()) return;
    setStatus('');

    const response = await fetch(`/api/admin/chats/${selectedConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: reply.trim(),
        attachments: replyAttachments
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to send reply.');
      return;
    }

    setReply('');
    setReplyAttachments([]);
    setStatus('Reply sent.');
    await loadMessages(selectedConversationId, 1);
    await loadConversations(conversationPage);
  };

  const updateConversation = async (
    conversationId: string,
    patch: { status?: 'open' | 'closed'; assigned_to?: string | null }
  ) => {
    const response = await fetch('/api/admin/chats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: conversationId,
        ...patch
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update conversation.');
      return;
    }

    setStatus('Conversation updated.');
    await loadConversations(conversationPage);
    if (selectedConversationId) {
      await loadMessages(selectedConversationId, messagePage);
    }
  };

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Chats Inbox</h1>
        <p className="mt-2 text-black/70">Review user conversations, reply as support/admin, and manage conversation state.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={!selectedConversationId}>
            Open Conversation
          </button>
          <button type="submit" form="send-reply-form" className="btn-subtle" disabled={!selectedConversationId}>
            Send Reply
          </button>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Thread controls</h2>
        <p className="mt-2 text-black/70">
          Mark threads resolved or reopen as needed to keep support queues accurate.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Mark Resolved</span>
          <span className="btn-subtle !cursor-default !opacity-70">Reopen</span>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <article className="card">
            <h2 className="text-lg font-semibold">Conversations</h2>
            {loadingConversations ? <p className="mt-3 text-sm text-black/60">Loading...</p> : null}
            {!loadingConversations && conversations.length === 0 ? (
              <div className="mt-3 space-y-2 text-sm text-black/60">
                <p>No conversations found.</p>
                <p>
                  User messages appear here only after they pass chat checks (signed in, verified email, and chat not rate-limited).
                </p>
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    selectedConversationId === conversation.id
                      ? 'border-[#99c53f] bg-[#f4f9ea]'
                      : 'border-black/10 bg-white'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {conversation.profile?.full_name || 'User conversation'}
                  </p>
                  <p className="mt-1 text-xs text-black/55">
                    {conversation.user_id.slice(0, 8)}... | {conversation.status}
                  </p>
                  {conversation.last_message_preview ? (
                    <p className="mt-1 line-clamp-2 text-xs text-black/60">
                      {conversation.last_message_preview}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-black/50">
                    {new Date(conversation.last_message_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-black/55">
                    unread(admin): {conversation.unread_count_admin}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="btn-subtle"
                disabled={conversationPage <= 1 || loadingConversations}
                onClick={() => void loadConversations(conversationPage - 1)}
              >
                Prev
              </button>
              <span className="text-xs text-black/65">
                {conversationPage}/{conversationTotalPages}
              </span>
              <button
                type="button"
                className="btn-subtle"
                disabled={conversationPage >= conversationTotalPages || loadingConversations}
                onClick={() => void loadConversations(conversationPage + 1)}
              >
                Next
              </button>
            </div>
          </article>
        </aside>

        <article className="card space-y-3">
          {!selectedConversation ? (
            <p className="text-black/65">Select a conversation to view messages.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-black/60">Conversation ID</p>
                  <p className="font-mono text-sm">{selectedConversation.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-subtle"
                    onClick={() =>
                      updateConversation(selectedConversation.id, {
                        status: selectedConversation.status === 'open' ? 'closed' : 'open'
                      })
                    }
                  >
                    {selectedConversation.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button
                    type="button"
                    className="btn-subtle"
                    onClick={() =>
                      updateConversation(selectedConversation.id, {
                        assigned_to:
                          selectedConversation.assigned_to === currentUserId
                            ? null
                            : currentUserId
                      })
                    }
                    disabled={!currentUserId}
                  >
                    {selectedConversation.assigned_to === currentUserId ? 'Unassign me' : 'Assign to me'}
                  </button>
                </div>
              </div>

              <div className="max-h-[460px] space-y-2 overflow-y-auto rounded-lg border border-black/10 bg-white/60 p-3">
                {loadingMessages ? <p className="text-sm text-black/60">Loading messages...</p> : null}
                {!loadingMessages && messages.length === 0 ? (
                  <p className="text-sm text-black/60">No messages in this conversation yet.</p>
                ) : null}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      message.sender_role === 'admin'
                        ? 'ml-auto bg-[#dff4be] text-[#172109]'
                        : 'bg-[#eef1f7] text-[#202943]'
                    }`}
                  >
                    <p>{message.body}</p>
                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
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
                      {message.sender_role} | {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={messagePage <= 1 || loadingMessages}
                  onClick={() => selectedConversationId && void loadMessages(selectedConversationId, messagePage - 1)}
                >
                  Prev
                </button>
                <span className="text-xs text-black/65">
                  {messagePage}/{messageTotalPages}
                </span>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={messagePage >= messageTotalPages || loadingMessages}
                  onClick={() => selectedConversationId && void loadMessages(selectedConversationId, messagePage + 1)}
                >
                  Next
                </button>
              </div>

              <div className="rounded-lg border border-black/10 bg-white/70 p-3">
                <label className="text-xs uppercase tracking-[0.1em] text-black/55">Canned replies</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cannedReplies.length === 0 ? (
                    <p className="text-xs text-black/55">No canned replies configured.</p>
                  ) : (
                    cannedReplies.map((replyTemplate) => (
                      <button
                        key={replyTemplate.id}
                        type="button"
                        className="btn-subtle !px-3 !py-1"
                        onClick={() => setReply(replyTemplate.body)}
                      >
                        {replyTemplate.title}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <form id="send-reply-form" onSubmit={sendReply} className="space-y-2">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  className="min-h-28 w-full rounded-lg border border-black/20 p-3"
                  placeholder="Reply as admin..."
                  required
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
                    disabled={uploadingAttachment}
                    className="max-w-full text-sm"
                  />
                  {uploadingAttachment ? <span className="text-xs text-black/55">Uploading...</span> : null}
                </div>
                {replyAttachments.length > 0 ? (
                  <div className="rounded-lg border border-black/10 bg-white/70 p-2 text-xs text-black/65">
                    {replyAttachments.map((attachment) => (
                      <p key={attachment.path}>
                        {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                      </p>
                    ))}
                  </div>
                ) : null}
                <button className="btn-primary" type="submit">
                  Send Reply
                </button>
              </form>
            </>
          )}
        </article>
      </div>

      <article className="card">
        <h2 className="text-2xl font-semibold">Private customer data</h2>
        <p className="mt-2 text-black/70">
          Treat all conversation content as private support data and access only for operational need.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/privacy-requests" className="btn-subtle">Open Privacy Requests</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
