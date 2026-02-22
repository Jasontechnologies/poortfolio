import type { Metadata } from 'next';
import { requireContentOpsPage } from '@/lib/supabase/guards';
import { AdminStatusClient } from './status-client';

export const metadata: Metadata = {
  title: 'Admin Status Console | JasonWorldOfTech',
  description: 'Private status and incident management for JasonWorldOfTech.',
  robots: { index: false, follow: false }
};

export default async function AdminStatusPage() {
  await requireContentOpsPage();
  return <AdminStatusClient />;
}
