import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';
import { markdownToHtml } from '@/lib/content/markdown';

type Params = {
  slug: string;
};

type PostRow = {
  title: string;
  slug: string;
  excerpt: string;
  content_markdown: string;
  content_html: string | null;
  published_at: string | null;
  publish_at: string | null;
  author_name: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  status: 'draft' | 'scheduled' | 'published';
};

async function loadPost(slug: string) {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);
  if (!flags.blog_enabled) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('posts')
    .select('title,slug,excerpt,content_markdown,content_html,published_at,publish_at,author_name,meta_title,meta_description,og_image_url,canonical_url,status')
    .eq('slug', slug)
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
    .maybeSingle();

  if (error || !data) return null;
  return data as PostRow;
}

export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const post = await loadPost(params.slug);
  if (!post) {
    return {
      title: 'Post not found | JasonWorldOfTech'
    };
  }

  const title = `${post.meta_title || post.title} | JasonWorldOfTech`;
  const description = post.meta_description || post.excerpt;
  const metadata: Metadata = {
    title,
    description
  };

  if (post.og_image_url) {
    metadata.openGraph = {
      title,
      description,
      images: [{ url: post.og_image_url }]
    };
  }

  if (post.canonical_url) {
    metadata.alternates = {
      canonical: post.canonical_url
    };
  }

  return metadata;
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const post = await loadPost(params.slug);

  if (!post) {
    notFound();
  }

  const renderedContent =
    post.content_html && post.content_html.trim()
      ? post.content_html
      : markdownToHtml(post.content_markdown);

  return (
    <section className="space-y-5 py-4">
      <article className="card max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-sm text-black/55">
          Published{' '}
          {post.publish_at
            ? new Date(post.publish_at).toLocaleDateString()
            : post.published_at
              ? new Date(post.published_at).toLocaleDateString()
              : 'Unscheduled'}{' '}
          {post.author_name ? `by ${post.author_name}` : ''}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/blog" className="btn-primary">Back to Blog</a>
          <a href="/updates" className="btn-subtle">View Updates</a>
        </div>
      </article>

      <article className="card max-w-4xl">
        <h2 className="text-2xl font-semibold">Article</h2>
        <p className="mt-2 text-black/70">
          This article is part of the JasonWorldOfTech knowledge base for Koola AI users and operators.
        </p>
        <div
          className="prose prose-sm mt-4 max-w-none rounded-xl border border-black/10 bg-white/60 p-4 text-black/80"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/support/chat" className="btn-subtle">Start Support Chat</a>
          <a href="/contact" className="btn-subtle">Contact</a>
        </div>
      </article>

      <article className="card max-w-4xl">
        <h2 className="text-2xl font-semibold">Need direct help?</h2>
        <p className="mt-2 text-black/70">
          Create an account to discuss implementation questions in a private support thread.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/sign-in" className="btn-subtle">Create Account</a>
          <a href="/support/chat" className="btn-subtle">Start Support Chat</a>
        </div>
      </article>
    </section>
  );
}
