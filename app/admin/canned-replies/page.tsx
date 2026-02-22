import type { Metadata } from 'next';
import { requireSupportPage } from '@/lib/supabase/guards';
import { CannedRepliesClient } from './replies-client';

export const metadata: Metadata = {
  title: 'Admin Canned Replies | JasonWorldOfTech',
  description: 'Private canned response library for JasonWorldOfTech support operations.',
  robots: { index: false, follow: false }
};

export default async function AdminCannedRepliesPage() {
  await requireSupportPage();
  return <CannedRepliesClient />;
}
