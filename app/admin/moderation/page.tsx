import type { Metadata } from 'next';
import { requireContentOpsPage } from '@/lib/supabase/guards';
import { ModerationClient } from './moderation-client';

export const metadata: Metadata = {
  title: 'Admin Moderation | JasonWorldOfTech',
  description: 'Private moderation queue for support and admin roles.',
  robots: { index: false, follow: false }
};

export default async function AdminModerationPage() {
  await requireContentOpsPage();
  return <ModerationClient />;
}
