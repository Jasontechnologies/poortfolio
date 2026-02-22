import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { AuditLogClient } from './audit-log-client';

export const metadata: Metadata = {
  title: 'Admin Audit Log | JasonWorldOfTech',
  description: 'Private audit event viewer for JasonWorldOfTech support and admin roles.',
  robots: { index: false, follow: false }
};

export default async function AdminAuditLogPage() {
  await requireSuperAdminPage();
  return <AuditLogClient />;
}
