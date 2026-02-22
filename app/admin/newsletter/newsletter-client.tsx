'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Subscriber = {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
  updated_at: string;
};

type NewsletterResponse = {
  error?: string;
  subscribers?: Subscriber[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export function AdminNewsletterClient() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadSubscribers = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/newsletter?page=${nextPage}&pageSize=${pageSize}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as NewsletterResponse;
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load newsletter subscribers.');
        return;
      }

      setSubscribers(payload.subscribers ?? []);
      setTotal(payload.pagination?.total ?? 0);
      setPage(payload.pagination?.page ?? nextPage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscribers(1);
  }, [loadSubscribers]);

  const updateStatus = async (id: string, statusValue: Subscriber['status']) => {
    setStatus('');
    const response = await fetch('/api/admin/newsletter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: statusValue })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update subscriber.');
      return;
    }

    setStatus('Subscriber updated.');
    void loadSubscribers(page);
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="mt-2 text-black/70">Review and manage newsletter subscriber records and consent status.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#newsletter-list" className="btn-primary">Save Subscriber Status</a>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Subscription integrity</h2>
        <p className="mt-3 text-black/70">
          Respect unsubscribe status and maintain accurate communication preferences.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Campaign readiness</h2>
        <p className="mt-3 text-black/70">
          Use active status only for users with valid subscription state.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Filter Active</span>
          <span className="btn-subtle !cursor-default !opacity-70">Filter Unsubscribed</span>
        </div>
      </article>

      <div id="newsletter-list" className="space-y-3">
        {loading ? <article className="card">Loading subscribers...</article> : null}
        {!loading && subscribers.length === 0 ? <article className="card">No subscribers found.</article> : null}
        {subscribers.map((subscriber) => (
          <article key={subscriber.id} className="card">
            <p className="font-semibold">{subscriber.email}</p>
            <p className="text-xs text-black/55">
              Subscribed {new Date(subscriber.created_at).toLocaleDateString()}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={subscriber.status}
                onChange={(event) => {
                  const nextStatus = event.target.value as Subscriber['status'];
                  setSubscribers((prev) =>
                    prev.map((existing) =>
                      existing.id === subscriber.id ? { ...existing, status: nextStatus } : existing
                    )
                  );
                }}
                className="rounded-lg border border-black/20 p-2"
              >
                <option value="active">active</option>
                <option value="unsubscribed">unsubscribed</option>
              </select>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateStatus(subscriber.id, subscriber.status)}
              >
                Save
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-subtle"
          disabled={page <= 1 || loading}
          onClick={() => void loadSubscribers(page - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-black/70">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-subtle"
          disabled={page >= totalPages || loading}
          onClick={() => void loadSubscribers(page + 1)}
        >
          Next
        </button>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
