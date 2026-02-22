'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type FlagRow = {
  key: string;
  enabled: boolean;
  updated_at: string;
};

const orderedKeys = ['chat_enabled', 'signup_enabled', 'products_enabled', 'blog_enabled', 'analytics_enabled'];

export function FeatureFlagsClient() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [status, setStatus] = useState('');

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/feature-flags', { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        flags?: FlagRow[];
      };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load feature flags.');
        return;
      }

      const rows = payload.flags ?? [];
      rows.sort((a, b) => orderedKeys.indexOf(a.key) - orderedKeys.indexOf(b.key));
      setFlags(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  const toggleFlag = async (row: FlagRow) => {
    setSavingKey(row.key);
    setStatus('');
    const response = await fetch('/api/admin/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: row.key,
        enabled: !row.enabled
      })
    });
    const payload = (await response.json()) as { error?: string };
    setSavingKey('');

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update feature flag.');
      return;
    }

    setStatus(`Updated ${row.key}.`);
    setFlags((prev) =>
      prev.map((flag) => (flag.key === row.key ? { ...flag, enabled: !flag.enabled } : flag))
    );
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <p className="mt-2 text-black/70">
          Enable or disable key platform modules such as signup, blog, products, chat, and analytics.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-primary !cursor-default !opacity-90">Toggle Flag</span>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Controlled rollout</h2>
        <p className="mt-3 text-black/70">
          Use flags for safe rollouts and incident response. Record reasons for state changes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
          <Link href="/admin/status" className="btn-subtle">Open Status Console</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Fast rollback</h2>
        <p className="mt-3 text-black/70">
          Disable affected modules quickly if operational or security risks are detected.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="btn-subtle !cursor-default !opacity-70">Disable Affected Flag</span>
          <Link href="/admin/chats" className="btn-subtle">Open Chats Inbox</Link>
        </div>
      </article>

      <article className="card">
        {loading ? <p className="text-sm text-black/65">Loading flags...</p> : null}
        {!loading && flags.length === 0 ? <p className="text-sm text-black/65">No flags found.</p> : null}
        <div className="space-y-3">
          {flags.map((row) => (
            <div key={row.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/70 p-3">
              <div>
                <p className="font-semibold">{row.key}</p>
                <p className="text-xs text-black/55">
                  Updated {new Date(row.updated_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className={row.enabled ? 'btn-primary' : 'btn-subtle'}
                onClick={() => toggleFlag(row)}
                disabled={savingKey === row.key}
              >
                {savingKey === row.key ? 'Saving...' : row.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </article>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
