import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';
import ChatClient from './chat-client';

export const metadata: Metadata = {
  title: 'Support Chat | JasonWorldOfTech',
  description: 'Private support chat for authenticated users of JasonWorldOfTech and Koola AI.'
};

export default async function SupportChatPage() {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);

  if (!flags.chat_enabled) {
    return (
      <section className="space-y-4 py-4">
        <article className="card max-w-2xl">
          <h1 className="text-3xl font-bold">Private support chat</h1>
          <p className="mt-3 text-black/70">Chat is temporarily unavailable.</p>
        </article>
      </section>
    );
  }

  return <ChatClient />;
}
