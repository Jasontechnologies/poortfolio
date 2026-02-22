'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ComplaintRow = {
  id: string;
  user_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  complaint_type: string | null;
  title: string;
  details: string;
  urls: string[];
  status: 'new' | 'in_review' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  source: string;
  created_at: string;
};

export function ComplaintsClient() {
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadComplaints = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/complaints?page=${nextPage}&pageSize=${pageSize}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as {
        error?: string;
        complaints?: ComplaintRow[];
        pagination?: { page: number; total: number };
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load complaints.');
        return;
      }

      setComplaints(payload.complaints ?? []);
      setPage(payload.pagination?.page ?? nextPage);
      setTotal(payload.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplaints(1);
  }, [loadComplaints]);

  const updateComplaint = async (
    id: string,
    nextStatus: ComplaintRow['status'],
    nextPriority: ComplaintRow['priority']
  ) => {
    setStatus('');
    const response = await fetch('/api/admin/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: nextStatus,
        priority: nextPriority
      })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update complaint.');
      return;
    }

    setStatus('Complaint updated.');
    void loadComplaints(page);
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Complaints Inbox</h1>
        <p className="mt-2 text-black/70">Manage DMCA, legal, policy, and privacy complaints from public forms and authenticated users.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-primary !cursor-default !opacity-90">Mark In Review</span>
          <span className="btn-subtle !cursor-default !opacity-70">Resolve Complaint</span>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Risk prioritization</h2>
        <p className="mt-3 text-black/70">
          Escalate high-risk complaints and keep status updates accurate.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Mark High Priority</span>
          <Link href="/admin/audit-log" className="btn-subtle">Open Audit Log</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Compliance handling</h2>
        <p className="mt-3 text-black/70">
          Use factual, timestamped actions for every complaint decision.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="mailto:legal@jasonworldoftech.com" className="btn-subtle">Contact Legal</a>
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
        </div>
      </article>

      <article className="card space-y-3">
        {loading ? <p className="text-sm text-black/65">Loading complaints...</p> : null}
        {!loading && complaints.length === 0 ? <p className="text-sm text-black/65">No complaints found.</p> : null}
        {complaints.map((complaint) => (
          <div key={complaint.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {complaint.complaint_type ?? complaint.title} | {complaint.status} | {complaint.priority}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{complaint.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/75">{complaint.details}</p>
            {complaint.urls?.length > 0 ? (
              <p className="mt-2 text-xs text-black/55">URLs: {complaint.urls.join(', ')}</p>
            ) : null}
            <p className="mt-2 text-xs text-black/55">
              Source: {complaint.source} | Reporter: {complaint.reporter_name ?? 'N/A'} ({complaint.reporter_email ?? 'N/A'})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateComplaint(complaint.id, 'in_review', complaint.priority)}
              >
                In review
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateComplaint(complaint.id, 'resolved', complaint.priority)}
              >
                Resolve
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateComplaint(complaint.id, complaint.status, 'high')}
              >
                Mark high priority
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
          onClick={() => void loadComplaints(page - 1)}
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
          onClick={() => void loadComplaints(page + 1)}
        >
          Next
        </button>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
