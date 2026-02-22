import type { ReactNode } from 'react';
import { requirePageAuth } from '@/lib/supabase/guards';

export default async function SupportChatLayout({ children }: { children: ReactNode }) {
  await requirePageAuth();
  return <>{children}</>;
}
