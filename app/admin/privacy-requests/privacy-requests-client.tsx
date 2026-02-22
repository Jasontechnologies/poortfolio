'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type PrivacyRequestRow = {
  id: string;
  user_id: string;
  type: 'export' | 'delete';
  status: 'pending' | 'in_review' | 'completed' | 'rejected';
  notes: string | null;
  created_at: string;
};

export function PrivacyRequestsClient() {
  const [requests, setRequests] = useState<PrivacyRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadRequests = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/privacy-requests?page=${nextPage}&pageSize=${pageSize}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as {
        error?: string;
        requests?: PrivacyRequestRow[];
        pagination?: { page: number; total: number };
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load privacy requests.');
        return;
      }

      setRequests(payload.requests ?? []);
      setPage(payload.pagination?.page ?? nextPage);
      setTotal(payload.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests(1);
  }, [loadRequests]);

  const updateRequest = async (
    id: string,
    nextStatus: PrivacyRequestRow['status'],
    notes?: string
  ) => {
    setStatus('');
    const response = await fetch('/api/admin/privacy-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: nextStatus,
        notes
      })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update request.');
      return;
    }

    setStatus('Request updated.');
    void loadRequests(page);
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Privacy Requests</h1>
        <p className="mt-2 text-black/70">Process export and deletion requests with status tracking and notes.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-primary !cursor-default !opacity-90">Mark In Review</span>
          <span className="btn-subtle !cursor-default !opacity-70">Mark Complete</span>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Request workflow</h2>
        <p className="mt-3 text-black/70">
          Verify request scope, apply status updates, and record completion details.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Reject Request</span>
          <span className="btn-subtle !cursor-default !opacity-70">Add Notes</span>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Data rights operations</h2>
        <p className="mt-3 text-black/70">
          Use this workflow to fulfill privacy commitments and maintain compliance records.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/privacy" className="btn-subtle">View Privacy Policy</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      <article className="card space-y-3">
        {loading ? <p className="text-sm text-black/65">Loading requests...</p> : null}
        {!loading && requests.length === 0 ? <p className="text-sm text-black/65">No requests found.</p> : null}
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {request.type} | {request.status}
            </p>
            <p className="mt-1 text-xs text-black/55">
              User {request.user_id.slice(0, 8)}...
            </p>
            <p className="mt-1 text-xs text-black/55">
              Submitted {new Date(request.created_at).toLocaleString()}
            </p>
            {request.notes ? <p className="mt-2 text-sm text-black/70">{request.notes}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-subtle" onClick={() => updateRequest(request.id, 'in_review')}>
                In review
              </button>
              <button type="button" className="btn-subtle" onClick={() => updateRequest(request.id, 'completed')}>
                Complete
              </button>
              <button type="button" className="btn-subtle" onClick={() => updateRequest(request.id, 'rejected')}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </article>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-subtle"
          disabled={page <= 1 || loading}
          onClick={() => void loadRequests(page - 1)}
        >
          Prev
        </button>
        <span className="text-xs text-black/65">
          {page}/{totalPages}
        </span>
        <button
          type="button"
          className="btn-subtle"
          disabled={page >= totalPages || loading}
          onClick={() => void loadRequests(page + 1)}
        >
          Next
        </button>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
