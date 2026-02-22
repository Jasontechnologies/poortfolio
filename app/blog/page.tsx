import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';

type SearchParams = {
  tag?: string | string[];
  category?: string | string[];
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
  publish_at: string | null;
  author_name: string | null;
  tags: string[] | null;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
};

export const metadata: Metadata = {
  title: 'Blog | JasonWorldOfTech',
  description: 'Read founder-led blog posts about Koola AI, product operations, security decisions, and practical AI implementation.'
};

function buildFilterHref(params: SearchParams) {
  const search = new URLSearchParams();
  const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  if (tag) search.set('tag', tag);
  if (category) search.set('category', category);
  const value = search.toString();
  return value ? `/blog?${value}` : '/blog';
}

export default async function BlogPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);
  const selectedTagValue = Array.isArray(searchParams.tag) ? searchParams.tag[0] : searchParams.tag;
  const selectedCategoryValue = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category;
  const selectedTag = selectedTagValue?.trim().toLowerCase() ?? '';
  const selectedCategory = selectedCategoryValue?.trim().toLowerCase() ?? '';

  if (!flags.blog_enabled) {
    return (
      <section className="space-y-4 py-4">
        <article className="card max-w-3xl">
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="mt-3 text-black/75">Blog is temporarily unavailable while maintenance is in progress.</p>
          <Link href="/status" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
            Check Status
          </Link>
        </article>
      </section>
    );
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name,slug')
    .order('name', { ascending: true });
  const { data: tags } = await supabase.from('tags').select('id,name,slug').order('name', { ascending: true });

  const categoryRows = (categories ?? []) as CategoryRow[];
  const tagRows = (tags ?? []) as TagRow[];

  let selectedCategoryId: string | null = null;
  if (selectedCategory) {
    selectedCategoryId = categoryRows.find((category) => category.slug === selectedCategory)?.id ?? null;
  }

  let query = supabase
    .from('posts')
    .select('id,title,slug,excerpt,published_at,publish_at,author_name,tags,category_id')
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order('publish_at', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false });

  if (selectedCategoryId) {
    query = query.eq('category_id', selectedCategoryId);
  }

  if (selectedTag) {
    query = query.contains('tags', [selectedTag]);
  }

  const { data, error } = await query;
  const posts = (data ?? []) as PostRow[];

  return (
    <section className="space-y-5 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-3 text-black/75">
          Founder notes, product education, and implementation details from JasonWorldOfTech and Koola AI.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={posts[0] ? `/blog/${posts[0].slug}` : '/blog'} className="btn-primary">Read Latest Post</Link>
          <Link href="/updates" className="btn-subtle">View Updates</Link>
        </div>
      </article>

      <article className="card max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Browse by topic</h2>
          <p className="mt-2 text-black/75">
            Use categories and tags to find what matters most, from product releases to technical operations.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-black/55">Browse Categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={buildFilterHref({ tag: selectedTag || undefined })} className="btn-subtle !px-3 !py-1">
              All
            </Link>
            {categoryRows.map((category) => (
              <Link
                key={category.id}
                href={buildFilterHref({
                  category: category.slug,
                  tag: selectedTag || undefined
                })}
                className="btn-subtle !px-3 !py-1"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-black/55">Browse Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={buildFilterHref({ category: selectedCategory || undefined })} className="btn-subtle !px-3 !py-1">
              All
            </Link>
            {tagRows.map((tag) => (
              <Link
                key={tag.id}
                href={buildFilterHref({
                  category: selectedCategory || undefined,
                  tag: tag.slug
                })}
                className="btn-subtle !px-3 !py-1"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Need operational announcements?</h2>
        <p className="mt-3 text-black/75">
          For uptime and incident information, use the public status page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/status" className="btn-subtle">Check Status</Link>
          <Link href="/contact" className="btn-subtle">Contact Support</Link>
        </div>
      </article>

      {error ? (
        <article className="card max-w-3xl">
          <p className="text-black/75">Posts are not available yet. Run the latest Supabase migration first.</p>
        </article>
      ) : null}

      {!error && posts.length === 0 ? (
        <article className="card max-w-3xl">
          <p className="text-black/75">No published posts yet.</p>
        </article>
      ) : null}

      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="card">
            <h2 className="text-2xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-black/70">{post.excerpt}</p>
            {post.tags && post.tags.length > 0 ? (
              <p className="mt-2 text-xs uppercase tracking-[0.1em] text-black/55">{post.tags.join(' | ')}</p>
            ) : null}
            <p className="mt-3 text-xs uppercase tracking-[0.1em] text-black/50">
              {post.publish_at
                ? new Date(post.publish_at).toLocaleDateString()
                : post.published_at
                  ? new Date(post.published_at).toLocaleDateString()
                  : 'Draft'}{' '}
              {post.author_name ? `| ${post.author_name}` : ''}
            </p>
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              Read article
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
