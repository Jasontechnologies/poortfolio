import type { Metadata } from 'next';
import { requireSupportPage } from '@/lib/supabase/guards';
import { AdminChatsClient } from './chats-client';

export const metadata: Metadata = {
  title: 'Admin Chats Inbox | JasonWorldOfTech',
  description: 'Private support chat inbox for JasonWorldOfTech operations team.',
  robots: { index: false, follow: false }
};

export default async function AdminChatsPage() {
  await requireSupportPage();
  return <AdminChatsClient />;
}
