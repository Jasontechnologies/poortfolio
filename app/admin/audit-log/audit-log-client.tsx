'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type AuditEvent = {
  id: string;
  action_type: string | null;
  action: string | null;
  actor_user_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  target_type: string | null;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export function AuditLogClient() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [actionType, setActionType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadEvents = useCallback(async (nextPage: number, nextActionType: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize)
      });
      if (nextActionType.trim()) {
        query.set('actionType', nextActionType.trim());
      }

      const response = await fetch(`/api/admin/audit-log?${query.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        events?: AuditEvent[];
        pagination?: { page: number; total: number };
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load audit events.');
        return;
      }

      setEvents(payload.events ?? []);
      setPage(payload.pagination?.page ?? nextPage);
      setTotal(payload.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents(1, '');
  }, [loadEvents]);

  const exportCsv = () => {
    const rows = [
      ['created_at', 'action_type', 'actor_role', 'actor_user_id', 'target_type', 'target_id', 'metadata']
    ];
    for (const event of events) {
      rows.push([
        event.created_at,
        event.action_type ?? event.action ?? '',
        event.actor_role ?? '',
        event.actor_user_id ?? event.actor_id ?? '',
        event.target_type ?? event.target_table ?? '',
        event.target_id ?? '',
        JSON.stringify(event.metadata ?? event.details ?? {})
      ]);
    }

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="mt-2 text-black/70">
          View time-ordered admin and support actions across content, users, privacy, and moderation workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void loadEvents(1, actionType)}
            disabled={loading}
          >
            Filter Events
          </button>
          <button type="button" className="btn-subtle" onClick={exportCsv} disabled={events.length === 0}>
            Export CSV
          </button>
          <input
            value={actionType}
            onChange={(event) => setActionType(event.target.value)}
            className="rounded-lg border border-black/20 px-3 py-2 text-sm"
            placeholder="action_type filter"
          />
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Event detail view</h2>
        <p className="mt-2 text-black/70">
          Each event includes actor, action type, target type, metadata, and timestamp.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-subtle" disabled>
            Open Related Record
          </button>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Compliance and accountability</h2>
        <p className="mt-2 text-black/70">
          Audit records support internal accountability, legal review, and incident investigation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/privacy-requests" className="btn-subtle">Open Privacy Requests</Link>
          <Link href="/admin/complaints" className="btn-subtle">Open Complaints Inbox</Link>
        </div>
      </article>

      <article className="card space-y-3">
        {loading ? <p className="text-sm text-black/65">Loading audit events...</p> : null}
        {!loading && events.length === 0 ? <p className="text-sm text-black/65">No audit events found.</p> : null}
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {event.action_type ?? event.action ?? 'unknown_action'}
            </p>
            <p className="mt-1 text-xs text-black/55">
              Actor: {event.actor_role ?? 'unknown'} ({(event.actor_user_id ?? event.actor_id ?? 'n/a').slice(0, 8)}...)
            </p>
            <p className="mt-1 text-xs text-black/55">
              Target: {event.target_type ?? event.target_table ?? 'n/a'} | {event.target_id ?? 'n/a'}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-black/60">
              {JSON.stringify(event.metadata ?? event.details ?? {}, null, 2)}
            </p>
            <p className="mt-1 text-xs text-black/50">{new Date(event.created_at).toLocaleString()}</p>
          </div>
        ))}
      </article>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-subtle"
          disabled={page <= 1 || loading}
          onClick={() => void loadEvents(page - 1, actionType)}
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
          onClick={() => void loadEvents(page + 1, actionType)}
        >
          Next
        </button>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
