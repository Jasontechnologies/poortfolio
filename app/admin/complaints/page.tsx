import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { ComplaintsClient } from './complaints-client';

export const metadata: Metadata = {
  title: 'Admin Complaints Inbox | JasonWorldOfTech',
  description: 'Private complaints management for legal and support workflows.',
  robots: { index: false, follow: false }
};

export default async function AdminComplaintsPage() {
  await requireSuperAdminPage();
  return <ComplaintsClient />;
}
