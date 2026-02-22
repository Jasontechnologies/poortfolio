'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ModerationItem = {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  payload: Record<string, unknown>;
  created_at: string;
  reviewed_at: string | null;
};

export function ModerationClient() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/moderation', { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        items?: ModerationItem[];
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load moderation items.');
        return;
      }

      setItems(payload.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const reviewItem = async (id: string, nextStatus: 'approved' | 'rejected') => {
    setStatus('');
    const response = await fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update moderation item.');
      return;
    }

    setStatus(`Item ${nextStatus}.`);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              reviewed_at: new Date().toISOString()
            }
          : item
      )
    );
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Moderation Queue</h1>
        <p className="mt-2 text-black/70">Review pending user-generated content flags and resolve each item with an explicit outcome.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-primary !cursor-default !opacity-90">Approve</span>
          <span className="btn-subtle !cursor-default !opacity-70">Reject</span>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Moderation standard</h2>
        <p className="mt-3 text-black/70">
          Apply consistent policy decisions and document outcomes where needed.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/acceptable-use" className="btn-subtle">View Acceptable Use</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Escalate legal-sensitive items</h2>
        <p className="mt-3 text-black/70">
          Escalate potential legal or abuse cases to complaints or security workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/complaints" className="btn-subtle">Open Complaints Inbox</Link>
          <Link href="/security" className="btn-subtle">Open Security Page</Link>
        </div>
      </article>

      <article className="card space-y-3">
        {loading ? <p className="text-sm text-black/65">Loading moderation queue...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-black/65">No moderation items yet.</p>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {item.type} | {item.status}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/75">
              {JSON.stringify(item.payload, null, 2)}
            </p>
            <p className="mt-2 text-xs text-black/55">
              Created {new Date(item.created_at).toLocaleString()}
              {item.reviewed_at ? ` | Reviewed ${new Date(item.reviewed_at).toLocaleString()}` : ''}
            </p>
            {item.status === 'pending' ? (
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-subtle" onClick={() => reviewItem(item.id, 'approved')}>
                  Approve
                </button>
                <button type="button" className="btn-subtle" onClick={() => reviewItem(item.id, 'rejected')}>
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
