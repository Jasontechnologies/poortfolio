import type { Metadata } from 'next';
import { requirePageAuth } from '@/lib/supabase/guards';
import NewComplaintClient from './new-complaint-client';

export const metadata: Metadata = {
  title: 'Submit Product Complaint | JasonWorldOfTech',
  description: 'Authenticated complaint submission for JasonWorldOfTech and Koola AI support workflows.'
};

export default async function SupportComplaintsNewPage() {
  await requirePageAuth();
  return <NewComplaintClient />;
}
