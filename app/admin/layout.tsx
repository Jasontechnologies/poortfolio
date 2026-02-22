import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyAdminRolePage } from '@/lib/supabase/guards';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { authContext } = await requireAnyAdminRolePage();
  const isSupport = authContext.role === 'support_agent' || authContext.role === 'admin' || authContext.role === 'super_admin';
  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin';
  const isSuperAdmin = authContext.role === 'super_admin';

  return (
    <section className="space-y-4">
      <article className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="mt-1 text-sm text-black/70">
              Signed in as <span className="font-semibold">{authContext.role}</span>
            </p>
          </div>
          <Link href="/" className="btn-subtle">
            Back to Site
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {isSupport ? <Link href="/admin/chats" className="btn-subtle !px-3 !py-1.5">Chats</Link> : null}
          {isSupport ? <Link href="/admin/canned-replies" className="btn-subtle !px-3 !py-1.5">Canned Replies</Link> : null}
          {isAdmin ? <Link href="/admin/posts" className="btn-subtle !px-3 !py-1.5">Posts</Link> : null}
          {isAdmin ? <Link href="/admin/products" className="btn-subtle !px-3 !py-1.5">Products</Link> : null}
          {isAdmin ? <Link href="/admin/updates" className="btn-subtle !px-3 !py-1.5">Updates</Link> : null}
          {isAdmin ? <Link href="/admin/status" className="btn-subtle !px-3 !py-1.5">Status</Link> : null}
          {isAdmin ? <Link href="/admin/moderation" className="btn-subtle !px-3 !py-1.5">Moderation</Link> : null}
          {isSuperAdmin ? <Link href="/admin/users" className="btn-subtle !px-3 !py-1.5">Users</Link> : null}
          {isSuperAdmin ? <Link href="/admin/privacy-requests" className="btn-subtle !px-3 !py-1.5">Privacy</Link> : null}
          {isSuperAdmin ? <Link href="/admin/complaints" className="btn-subtle !px-3 !py-1.5">Complaints</Link> : null}
          {isSuperAdmin ? <Link href="/admin/feature-flags" className="btn-subtle !px-3 !py-1.5">Flags</Link> : null}
          {isSuperAdmin ? <Link href="/admin/newsletter" className="btn-subtle !px-3 !py-1.5">Newsletter</Link> : null}
          {isSuperAdmin ? <Link href="/admin/audit-log" className="btn-subtle !px-3 !py-1.5">Audit Log</Link> : null}
        </div>
      </article>
      {children}
    </section>
  );
}
