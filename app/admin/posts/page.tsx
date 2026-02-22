import type { Metadata } from 'next';
import { requireContentOpsPage } from '@/lib/supabase/guards';
import AdminPostsClient from './posts-client';

export const metadata: Metadata = {
  title: 'Admin Posts | JasonWorldOfTech',
  description: 'Private blog post management for JasonWorldOfTech admin team.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPostsPage() {
  await requireContentOpsPage();
  return <AdminPostsClient />;
}
