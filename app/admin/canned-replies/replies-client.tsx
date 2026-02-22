'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

type CannedReply = {
  id: string;
  title: string;
  body: string;
};

export function CannedRepliesClient() {
  const [replies, setReplies] = useState<CannedReply[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '' });

  const loadReplies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/canned-replies', { cache: 'no-store' });
      const payload = (await response.json()) as { error?: string; replies?: CannedReply[] };
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load canned replies.');
        return;
      }
      setReplies(payload.replies ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReplies();
  }, []);

  const createReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/canned-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to create canned reply.');
      return;
    }

    setStatus('Canned reply created.');
    setDraft({ title: '', body: '' });
    void loadReplies();
  };

  const updateReply = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/canned-replies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title: String(form.get('title') ?? ''),
        body: String(form.get('body') ?? '')
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update canned reply.');
      return;
    }

    setStatus('Canned reply updated.');
    void loadReplies();
  };

  const deleteReply = async (id: string) => {
    setSaving(true);
    setStatus('');
    const response = await fetch(`/api/admin/canned-replies?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to delete canned reply.');
      return;
    }

    setStatus('Canned reply deleted.');
    void loadReplies();
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Canned Replies</h1>
        <p className="mt-2 text-black/70">Create reusable support responses for faster, consistent customer communication.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" form="create-reply-form" className="btn-primary" disabled={saving}>Create Reply</button>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-xl font-semibold">Edit reply templates</h2>
        <p className="mt-2 text-black/70">
          Store concise, professional templates for common support scenarios.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Save Reply</span>
          <span className="btn-subtle !cursor-default !opacity-70">Delete Reply</span>
        </div>
        <form id="create-reply-form" onSubmit={createReply} className="mt-3 space-y-3">
          <input
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-lg border border-black/20 p-2"
            placeholder="Reply title"
            required
          />
          <textarea
            value={draft.body}
            onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
            className="min-h-28 w-full rounded-lg border border-black/20 p-2"
            placeholder="Reply body"
            required
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create reply'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Consistency and tone</h2>
        <p className="mt-3 text-black/70">
          Replies should be direct, respectful, and aligned with founder-led brand voice.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/chats" className="btn-subtle">Open Chats Inbox</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      <article className="card space-y-3">
        <h2 className="text-xl font-semibold">Saved Replies</h2>
        {loading ? <p className="text-sm text-black/65">Loading replies...</p> : null}
        {!loading && replies.length === 0 ? <p className="text-sm text-black/65">No canned replies yet.</p> : null}
        {replies.map((reply) => (
          <form key={reply.id} onSubmit={(event) => updateReply(event, reply.id)} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <input
              name="title"
              defaultValue={reply.title}
              className="w-full rounded-lg border border-black/20 p-2"
              required
            />
            <textarea
              name="body"
              defaultValue={reply.body}
              className="mt-2 min-h-24 w-full rounded-lg border border-black/20 p-2"
              required
            />
            <div className="mt-2 flex gap-2">
              <button type="submit" className="btn-subtle" disabled={saving}>
                Save
              </button>
              <button type="button" className="btn-subtle" disabled={saving} onClick={() => deleteReply(reply.id)}>
                Delete
              </button>
            </div>
          </form>
        ))}
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
