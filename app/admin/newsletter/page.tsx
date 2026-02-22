import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { AdminNewsletterClient } from './newsletter-client';

export const metadata: Metadata = {
  title: 'Admin Newsletter | JasonWorldOfTech',
  description: 'Private newsletter subscriber management for super admins.',
  robots: { index: false, follow: false }
};

export default async function AdminNewsletterPage() {
  await requireSuperAdminPage();
  return <AdminNewsletterClient />;
}
