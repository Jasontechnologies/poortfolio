import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { AdminUsersClient } from './users-client';

export const metadata: Metadata = {
  title: 'Admin Users | JasonWorldOfTech',
  description: 'Private user and role administration for super admins.',
  robots: { index: false, follow: false }
};

export default async function AdminUsersPage() {
  await requireSuperAdminPage();
  return <AdminUsersClient />;
}
