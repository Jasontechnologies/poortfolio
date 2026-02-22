'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

type SystemStatus = {
  current_status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  message: string | null;
};

type Incident = {
  id: string;
  title: string;
  details: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  status: 'open' | 'resolved';
  published: boolean;
  incident_date: string;
  resolved_at: string | null;
};

export function AdminStatusClient() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    current_status: 'operational',
    message: 'All systems operational'
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newIncident, setNewIncident] = useState({
    title: '',
    details: '',
    severity: 'minor' as Incident['severity'],
    status: 'open' as Incident['status'],
    published: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/status', { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        systemStatus?: SystemStatus;
        incidents?: Incident[];
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load status data.');
        return;
      }

      if (payload.systemStatus) {
        setSystemStatus(payload.systemStatus);
      }
      setIncidents(payload.incidents ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const saveSystemStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'system',
        current_status: systemStatus.current_status,
        message: systemStatus.message
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to save system status.');
      return;
    }

    setStatus('System status updated.');
    void loadData();
  };

  const createIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIncident)
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to create incident.');
      return;
    }

    setStatus('Incident created.');
    setNewIncident({
      title: '',
      details: '',
      severity: 'minor',
      status: 'open',
      published: false
    });
    void loadData();
  };

  const updateIncident = async (incident: Incident, patch: Partial<Incident>) => {
    setSaving(true);
    setStatus('');
    const response = await fetch('/api/admin/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'incident',
        id: incident.id,
        ...patch
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update incident.');
      return;
    }

    setStatus('Incident updated.');
    void loadData();
  };

  const deleteIncident = async (id: string) => {
    setSaving(true);
    setStatus('');
    const response = await fetch(`/api/admin/status?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to delete incident.');
      return;
    }

    setStatus('Incident deleted.');
    void loadData();
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Status Console</h1>
        <p className="mt-2 text-black/70">Set current platform state and message for the public status page.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" form="system-status-form" className="btn-primary" disabled={saving}>Save Status</button>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-xl font-semibold">System Status</h2>
        <form id="system-status-form" className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={saveSystemStatus}>
          <select
            value={systemStatus.current_status}
            onChange={(event) =>
              setSystemStatus((prev) => ({
                ...prev,
                current_status: event.target.value as SystemStatus['current_status']
              }))
            }
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="operational">operational</option>
            <option value="degraded">degraded</option>
            <option value="outage">outage</option>
            <option value="maintenance">maintenance</option>
          </select>
          <input
            value={systemStatus.message ?? ''}
            onChange={(event) => setSystemStatus((prev) => ({ ...prev, message: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="Status message"
          />
          <button type="submit" className="btn-primary md:col-span-2" disabled={saving}>
            {saving ? 'Saving...' : 'Save Status'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2 className="text-xl font-semibold">Incident management</h2>
        <p className="mt-2 text-black/70">
          Create, update, publish, resolve, or remove incident records with severity tags.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" form="create-incident-form" className="btn-subtle" disabled={saving}>Create Incident</button>
          <span className="btn-subtle !cursor-default !opacity-70">Publish/Unpublish Incident</span>
        </div>
        <form id="create-incident-form" className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={createIncident}>
          <input
            value={newIncident.title}
            onChange={(event) => setNewIncident((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-lg border border-black/20 p-2"
            placeholder="Title"
            required
          />
          <select
            value={newIncident.severity}
            onChange={(event) =>
              setNewIncident((prev) => ({ ...prev, severity: event.target.value as Incident['severity'] }))
            }
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="info">info</option>
            <option value="minor">minor</option>
            <option value="major">major</option>
            <option value="critical">critical</option>
          </select>
          <textarea
            value={newIncident.details}
            onChange={(event) => setNewIncident((prev) => ({ ...prev, details: event.target.value }))}
            className="rounded-lg border border-black/20 p-2 md:col-span-2"
            placeholder="Details"
            required
          />
          <select
            value={newIncident.status}
            onChange={(event) =>
              setNewIncident((prev) => ({ ...prev, status: event.target.value as Incident['status'] }))
            }
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="open">open</option>
            <option value="resolved">resolved</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/60 px-3 py-2">
            <input
              type="checkbox"
              checked={newIncident.published}
              onChange={(event) => setNewIncident((prev) => ({ ...prev, published: event.target.checked }))}
            />
            <span className="text-sm text-black/70">Published</span>
          </label>
          <button type="submit" className="btn-subtle md:col-span-2" disabled={saving}>
            {saving ? 'Saving...' : 'Create Incident'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Transparency standard</h2>
        <p className="mt-3 text-black/70">
          Status updates should be factual, timely, and clearly dated.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/status" className="btn-subtle">View Public Status</Link>
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
        </div>
      </article>

      <article className="card space-y-3">
        <h2 className="text-xl font-semibold">Incidents</h2>
        {loading ? <p className="text-sm text-black/65">Loading incidents...</p> : null}
        {!loading && incidents.length === 0 ? <p className="text-sm text-black/65">No incidents yet.</p> : null}
        {incidents.map((incident) => (
          <div key={incident.id} className="rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-black/55">
              {incident.severity} | {incident.status} | {incident.published ? 'published' : 'draft'}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{incident.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/75">{incident.details}</p>
            <p className="mt-2 text-xs text-black/55">
              {new Date(incident.incident_date).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateIncident(incident, { status: incident.status === 'open' ? 'resolved' : 'open' })}
                disabled={saving}
              >
                {incident.status === 'open' ? 'Mark resolved' : 'Reopen'}
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateIncident(incident, { published: !incident.published })}
                disabled={saving}
              >
                {incident.published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => deleteIncident(incident.id)}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
