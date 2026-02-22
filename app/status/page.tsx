import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type SystemStatusRow = {
  current_status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  message: string | null;
  updated_at: string;
};

type IncidentRow = {
  id: string;
  title: string;
  details: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  status: 'open' | 'resolved';
  incident_date: string;
  resolved_at: string | null;
};

const STATUS_COLORS: Record<SystemStatusRow['current_status'], string> = {
  operational: 'text-green-700',
  degraded: 'text-amber-700',
  outage: 'text-red-700',
  maintenance: 'text-blue-700'
};

export const metadata: Metadata = {
  title: 'Status | JasonWorldOfTech',
  description: 'Live system status and incident history for JasonWorldOfTech and Koola AI.'
};

export default async function StatusPage() {
  const supabase = await createClient();
  const { data: currentStatus } = await supabase
    .from('system_status')
    .select('current_status,message,updated_at')
    .eq('id', true)
    .maybeSingle();

  const { data: incidents } = await supabase
    .from('status_incidents')
    .select('id,title,details,severity,status,incident_date,resolved_at')
    .eq('published', true)
    .order('incident_date', { ascending: false })
    .limit(20);

  const statusRow = (currentStatus ?? {
    current_status: 'operational',
    message: 'All systems operational',
    updated_at: new Date().toISOString()
  }) as SystemStatusRow;

  const incidentRows = (incidents ?? []) as IncidentRow[];

  return (
    <section className="space-y-5 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="mt-3 text-black/75">
          Current uptime state for Koola AI and support systems, updated by the operations team.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="#incidents" className="btn-primary">View Incidents</a>
          <Link href="/support/chat" className="btn-subtle">Start Support Chat</Link>
        </div>
        <p className={`mt-5 text-lg font-semibold capitalize ${STATUS_COLORS[statusRow.current_status]}`}>
          {statusRow.current_status}
        </p>
        <p className="mt-2 text-black/75">{statusRow.message ?? 'No additional details available.'}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.1em] text-black/50">
          Updated {new Date(statusRow.updated_at).toLocaleString()}
        </p>
      </article>

      <article id="incidents" className="card space-y-3">
        <h2 className="text-2xl font-semibold">Recent incidents</h2>
        <p className="text-black/70">
          Published incidents include severity, start time, impact summary, and resolution status.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/updates" className="btn-subtle">View Updates</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
        {incidentRows.length === 0 ? (
          <p className="text-black/70">No recent incidents.</p>
        ) : (
          <div className="space-y-3">
            {incidentRows.map((incident) => (
              <div key={incident.id} className="rounded-xl border border-black/10 bg-white/60 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-black/55">
                  {incident.severity} | {incident.status}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{incident.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-black/75">{incident.details}</p>
                <p className="mt-2 text-xs text-black/55">
                  Started {new Date(incident.incident_date).toLocaleString()}
                  {incident.resolved_at ? ` | Resolved ${new Date(incident.resolved_at).toLocaleString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Experiencing an issue?</h2>
        <p className="mt-3 text-black/70">
          Create an account and open a private support chat for account-specific troubleshooting.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
          <Link href="/support/chat" className="btn-subtle">Start Support Chat</Link>
        </div>
      </article>
    </section>
  );
}
