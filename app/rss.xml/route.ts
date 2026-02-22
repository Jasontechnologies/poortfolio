import { createClient } from '@/lib/supabase/server';

function xmlEscape(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from('posts')
    .select('title,slug,excerpt,publish_at,published_at,updated_at')
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
    .order('publish_at', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const items = (data ?? [])
    .map((post) => {
      const postDate = post.publish_at ?? post.published_at ?? post.updated_at ?? new Date().toISOString();
      const link = `${siteUrl}/blog/${post.slug}`;
      return `<item>
<title>${xmlEscape(post.title)}</title>
<link>${xmlEscape(link)}</link>
<guid>${xmlEscape(link)}</guid>
<description>${xmlEscape(post.excerpt ?? '')}</description>
<pubDate>${new Date(postDate).toUTCString()}</pubDate>
</item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>JasonWorldOfTech Blog</title>
<link>${xmlEscape(siteUrl)}</link>
<description>Product updates and engineering notes.</description>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate=3600'
    }
  });
}
