'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { markdownToHtml } from '@/lib/content/markdown';

type UpdateRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  status: 'draft' | 'published';
  published_at: string | null;
};

export function UpdatesClient() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState({
    title: '',
    slug: '',
    summary: '',
    content_markdown: '',
    status: 'draft' as 'draft' | 'published'
  });

  const publishedCount = useMemo(
    () => updates.filter((item) => item.status === 'published').length,
    [updates]
  );

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/updates', { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        updates?: UpdateRow[];
      };
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load updates.');
        return;
      }

      setUpdates(payload.updates ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUpdates();
  }, []);

  const createUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to create update.');
      return;
    }

    setStatus('Update created.');
    setDraft({
      title: '',
      slug: '',
      summary: '',
      content_markdown: '',
      status: 'draft'
    });
    void loadUpdates();
  };

  const saveUpdate = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/updates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title: String(form.get('title') ?? ''),
        slug: String(form.get('slug') ?? ''),
        summary: String(form.get('summary') ?? ''),
        content_markdown: String(form.get('content_markdown') ?? ''),
        status: String(form.get('status') ?? 'draft')
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update item.');
      return;
    }

    setStatus('Update saved.');
    void loadUpdates();
  };

  const deleteUpdate = async (id: string) => {
    setSaving(true);
    setStatus('');
    const response = await fetch(`/api/admin/updates?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to delete update.');
      return;
    }

    setStatus('Update deleted.');
    void loadUpdates();
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Updates</h1>
        <p className="mt-2 text-black/70">
          Create and maintain official announcements for product, policy, and operations.
        </p>
        <p className="mt-2 text-black/70">
          {updates.length} total updates, {publishedCount} published.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#create-update" className="btn-primary">Create Update</a>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article id="create-update" className="card">
        <h2 className="text-xl font-semibold">Announcement editor</h2>
        <p className="mt-2 text-black/70">
          Publish concise updates with clear dates and impact descriptions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" form="create-update-form" className="btn-subtle" disabled={saving}>Save Update</button>
          <span className="btn-subtle !cursor-default !opacity-70">Publish/Unpublish</span>
        </div>
        <form id="create-update-form" onSubmit={createUpdate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="Title"
            required
          />
          <input
            value={draft.slug}
            onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="slug"
            required
          />
          <textarea
            value={draft.summary}
            onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Summary"
            required
          />
          <textarea
            value={draft.content_markdown}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, content_markdown: event.target.value }))
            }
            className="min-h-36 rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Markdown content"
            required
          />
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, status: event.target.value as 'draft' | 'published' }))
            }
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create Update'}
          </button>
          <article className="md:col-span-2 rounded-xl border border-black/10 bg-white/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-black/55">Preview</p>
            <div
              className="prose prose-sm mt-2 max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(draft.content_markdown) }}
            />
          </article>
        </form>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Public preview</h2>
        <p className="mt-3 text-black/70">
          Review markdown formatting before publishing to the updates page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#create-update" className="btn-subtle">Preview</a>
          <Link href="/updates" className="btn-subtle">View Public Updates</Link>
        </div>
      </article>

      <div className="space-y-3">
        {loading ? <article className="card">Loading updates...</article> : null}
        {!loading && updates.length === 0 ? <article className="card">No updates yet.</article> : null}
        {updates.map((item) => (
          <article key={item.id} className="card">
            <form onSubmit={(event) => saveUpdate(event, item.id)} className="grid gap-3 md:grid-cols-2">
              <input name="title" defaultValue={item.title} className="rounded-lg border border-black/20 p-2" required />
              <input name="slug" defaultValue={item.slug} className="rounded-lg border border-black/20 p-2" required />
              <textarea
                name="summary"
                defaultValue={item.summary}
                className="rounded-lg border border-black/20 p-2 md:col-span-2"
                required
              />
              <textarea
                name="content_markdown"
                defaultValue={item.content_markdown}
                className="min-h-36 rounded-lg border border-black/20 p-2 md:col-span-2"
                required
              />
              <select name="status" defaultValue={item.status} className="rounded-lg border border-black/20 p-2">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-subtle" disabled={saving}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={saving}
                  onClick={() => deleteUpdate(item.id)}
                >
                  Delete
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
