import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { PrivacyRequestsClient } from './privacy-requests-client';

export const metadata: Metadata = {
  title: 'Admin Privacy Requests | JasonWorldOfTech',
  description: 'Private privacy request management for support and admin teams.',
  robots: { index: false, follow: false }
};

export default async function AdminPrivacyRequestsPage() {
  await requireSuperAdminPage();
  return <PrivacyRequestsClient />;
}
