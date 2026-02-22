import type { Metadata } from 'next';
import { requireSuperAdminPage } from '@/lib/supabase/guards';
import { FeatureFlagsClient } from './feature-flags-client';

export const metadata: Metadata = {
  title: 'Admin Feature Flags | JasonWorldOfTech',
  description: 'Private runtime feature control for JasonWorldOfTech admins.',
  robots: { index: false, follow: false }
};

export default async function AdminFeatureFlagsPage() {
  await requireSuperAdminPage();
  return <FeatureFlagsClient />;
}
