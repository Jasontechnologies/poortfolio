import type { Metadata } from 'next';
import { requirePageAuth } from '@/lib/supabase/guards';
import { AccountPrivacyClient } from './privacy-client';

export const metadata: Metadata = {
  title: 'Privacy Controls | JasonWorldOfTech',
  description: 'Manage account data export and deletion requests in your JasonWorldOfTech privacy controls dashboard.'
};

export default async function AccountPrivacyPage() {
  await requirePageAuth();
  return <AccountPrivacyClient />;
}
