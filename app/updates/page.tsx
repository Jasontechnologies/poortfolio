import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type UpdateRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  published_at: string | null;
};

export const metadata: Metadata = {
  title: 'Updates | JasonWorldOfTech',
  description: 'Track official product and company updates for Koola AI and JasonWorldOfTech.'
};

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('updates')
    .select('id,title,slug,summary,content_markdown,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });

  const updates = (data ?? []) as UpdateRow[];

  return (
    <section className="space-y-5 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Updates</h1>
        <p className="mt-3 text-black/70">
          Official announcements for JasonWorldOfTech and Koola AI, including launches, policy changes, and operational notices.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={updates[0] ? `#${updates[0].slug}` : '/updates'} className="btn-primary">Read Latest Update</a>
          <Link href="/status" className="btn-subtle">Check Status</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Recent announcements</h2>
        <p className="mt-3 text-black/70">
          Updates are posted with dates so customers can track product and policy changes clearly.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/blog" className="btn-subtle">View Blog</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Service interruption notices</h2>
        <p className="mt-3 text-black/70">
          If an update relates to uptime, the full incident timeline is published on the status page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/status" className="btn-subtle">View Status</Link>
          <Link href="/support/chat" className="btn-subtle">Start Support Chat</Link>
        </div>
      </article>

      {error ? (
        <article className="card max-w-3xl">
          <p className="text-black/75">Updates are not available yet. Apply the latest migrations first.</p>
        </article>
      ) : null}

      {!error && updates.length === 0 ? (
        <article className="card max-w-3xl">
          <p className="text-black/75">No published updates yet.</p>
        </article>
      ) : null}

      <div className="space-y-3">
        {updates.map((item) => (
          <article id={item.slug} key={item.id} className="card">
            <h3 className="text-2xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-black/70">{item.summary}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.1em] text-black/50">
              {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Draft'}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-black/75">
              {item.content_markdown.length > 480
                ? `${item.content_markdown.slice(0, 480)}...`
                : item.content_markdown}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
