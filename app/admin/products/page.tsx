import type { Metadata } from 'next';
import { requireContentOpsPage } from '@/lib/supabase/guards';
import AdminProductsClient from './products-client';

export const metadata: Metadata = {
  title: 'Admin Products | JasonWorldOfTech',
  description: 'Private product management for JasonWorldOfTech admin team.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminProductsPage() {
  await requireContentOpsPage();
  return <AdminProductsClient />;
}
