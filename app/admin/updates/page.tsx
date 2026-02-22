import type { Metadata } from 'next';
import { requireContentOpsPage } from '@/lib/supabase/guards';
import { UpdatesClient } from './updates-client';

export const metadata: Metadata = {
  title: 'Admin Updates | JasonWorldOfTech',
  description: 'Private updates management for JasonWorldOfTech operations team.',
  robots: { index: false, follow: false }
};

export default async function AdminUpdatesPage() {
  await requireContentOpsPage();
  return <UpdatesClient />;
}
