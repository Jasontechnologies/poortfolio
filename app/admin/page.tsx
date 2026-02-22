import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyAdminRolePage } from '@/lib/supabase/guards';

export const metadata: Metadata = {
  title: 'Admin Console | JasonWorldOfTech',
  description: 'Private admin console for JasonWorldOfTech operations.',
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const { authContext } = await requireAnyAdminRolePage();
  const isSupportAgent =
    authContext.role === 'support_agent' || authContext.role === 'admin' || authContext.role === 'super_admin';
  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin';
  const isSuperAdmin = authContext.role === 'super_admin';

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <p className="mt-2 text-black/70">
          Central operations dashboard for content, support, compliance, and platform controls.
        </p>
        <p className="mt-2 text-black/70">
          Signed in role: <span className="font-semibold">{authContext.role}</span>
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {isSupportAgent ? <Link href="/admin/chats" className="btn-subtle">Open Chats Inbox</Link> : null}
          {isSupportAgent ? <Link href="/admin/canned-replies" className="btn-subtle">Canned Replies</Link> : null}

          {isAdmin ? <Link href="/admin/products" className="btn-subtle">Manage Products</Link> : null}
          {isAdmin ? <Link href="/admin/posts" className="btn-subtle">Manage Posts</Link> : null}
          {isAdmin ? <Link href="/admin/updates" className="btn-subtle">Manage Updates</Link> : null}
          {isAdmin ? <Link href="/admin/status" className="btn-subtle">Status Console</Link> : null}
          {isAdmin ? <Link href="/admin/moderation" className="btn-subtle">Moderation Queue</Link> : null}

          {isSuperAdmin ? <Link href="/admin/users" className="btn-subtle">Users</Link> : null}
          {isSuperAdmin ? <Link href="/admin/newsletter" className="btn-subtle">Newsletter</Link> : null}
          {isSuperAdmin ? <Link href="/admin/feature-flags" className="btn-subtle">Feature Flags</Link> : null}
          {isSuperAdmin ? <Link href="/admin/audit-log" className="btn-subtle">Audit Log</Link> : null}
          {isSuperAdmin ? <Link href="/admin/privacy-requests" className="btn-subtle">Privacy Requests</Link> : null}
          {isSuperAdmin ? <Link href="/admin/complaints" className="btn-subtle">Complaints Inbox</Link> : null}
        </div>
      </article>
    </section>
  );
}
