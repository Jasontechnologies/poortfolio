'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PrivacyRequest = {
  id: string;
  type: 'export' | 'delete';
  status: 'pending' | 'in_review' | 'completed' | 'rejected';
  notes: string | null;
  created_at: string;
};

export function AccountPrivacyClient() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/account/privacy-requests', { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        requests?: PrivacyRequest[];
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load privacy requests.');
        return;
      }

      setRequests(payload.requests ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const submitRequest = async (type: 'export' | 'delete') => {
    setSubmitting(true);
    setStatus('');

    const response = await fetch('/api/account/privacy-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const payload = (await response.json()) as { error?: string };
    setSubmitting(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to submit request.');
      return;
    }

    setStatus(type === 'export' ? 'Data export request submitted.' : 'Account deletion request submitted.');
    void loadRequests();
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Privacy controls</h1>
        <p className="mt-2 text-black/70">
          Submit data export or account deletion requests from one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={submitting} onClick={() => submitRequest('export')}>
            Request Data Export
          </button>
          <button type="button" className="btn-subtle" disabled={submitting} onClick={() => submitRequest('delete')}>
            Request Account Deletion
          </button>
        </div>
      </article>

      <article className="card space-y-3">
        <h2 className="text-xl font-semibold">Request history</h2>
        <p className="text-black/70">
          Track status updates for each privacy request, including notes from the review team.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-subtle" onClick={() => void loadRequests()}>
            Refresh History
          </button>
          <Link href="/contact" className="btn-subtle">Contact Support</Link>
        </div>
        {loading ? <p className="text-sm text-black/65">Loading requests...</p> : null}
        {!loading && requests.length === 0 ? (
          <p className="text-sm text-black/65">No privacy requests yet.</p>
        ) : null}
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {request.type} | {request.status}
            </p>
            <p className="mt-2 text-xs text-black/55">
              Created {new Date(request.created_at).toLocaleString()}
            </p>
            {request.notes ? <p className="mt-2 text-sm text-black/70">{request.notes}</p> : null}
          </div>
        ))}
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Your data rights</h2>
        <p className="mt-3 text-black/70">
          We process privacy requests in queue order and document outcomes for compliance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
        </div>
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
