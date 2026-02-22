'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import Link from 'next/link';
import { TiptapEditor } from '@/components/admin/tiptap-editor';

type PostStatus = 'draft' | 'scheduled' | 'published';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content_markdown: string;
  content_json: JSONContent | null;
  content_html: string | null;
  status: PostStatus;
  publish_at: string | null;
  published_at: string | null;
  tags: string[] | null;
  category_id: string | null;
  author_name: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type PostsResponse = {
  error?: string;
  posts?: Post[];
  categories?: Category[];
  tags?: Tag[];
};

type EditorFormState = {
  title: string;
  slug: string;
  excerpt: string;
  status: PostStatus;
  publish_at: string;
  author_name: string;
  category: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  canonical_url: string;
};

const EMPTY_EDITOR_JSON: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};

const EMPTY_FORM: EditorFormState = {
  title: '',
  slug: '',
  excerpt: '',
  status: 'draft',
  publish_at: '',
  author_name: '',
  category: '',
  tags: '',
  meta_title: '',
  meta_description: '',
  og_image_url: '',
  canonical_url: ''
};

function toDatetimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminPostsClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [knownTags, setKnownTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorFormState>(EMPTY_FORM);
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_EDITOR_JSON);
  const [contentHtml, setContentHtml] = useState('<p></p>');
  const [contentText, setContentText] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const activePostIdRef = useRef<string | null>(null);
  const lastSavedFingerprintRef = useRef<string>('');

  useEffect(() => {
    activePostIdRef.current = activePostId;
  }, [activePostId]);

  const publishedCount = useMemo(
    () =>
      posts.filter((post) => {
        if (post.status === 'published') return true;
        if (post.status === 'scheduled' && post.publish_at) {
          return new Date(post.publish_at).getTime() <= Date.now();
        }
        return false;
      }).length,
    [posts]
  );

  const scheduledCount = useMemo(() => posts.filter((post) => post.status === 'scheduled').length, [posts]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const contentSignature = useMemo(() => JSON.stringify(contentJson ?? EMPTY_EDITOR_JSON), [contentJson]);

  const editorFingerprint = useMemo(
    () =>
      JSON.stringify({
        form,
        contentSignature,
        contentHtml
      }),
    [contentHtml, contentSignature, form]
  );

  const hasUnsavedChanges = editorFingerprint !== lastSavedFingerprintRef.current;

  const syncSaveFingerprint = useCallback(
    (nextFingerprint = editorFingerprint) => {
      lastSavedFingerprintRef.current = nextFingerprint;
      setSaveIndicator('saved');
      setSavedAt(new Date().toLocaleTimeString());
    },
    [editorFingerprint]
  );

  const resetToCreateMode = useCallback(() => {
    setActivePostId(null);
    setForm(EMPTY_FORM);
    setContentJson(EMPTY_EDITOR_JSON);
    setContentHtml('<p></p>');
    setContentText('');
    const emptyFingerprint = JSON.stringify({
      form: EMPTY_FORM,
      contentSignature: JSON.stringify(EMPTY_EDITOR_JSON),
      contentHtml: '<p></p>'
    });
    lastSavedFingerprintRef.current = emptyFingerprint;
    setSaveIndicator('idle');
    setSavedAt(null);
  }, []);

  const applyPostToEditor = useCallback(
    (post: Post, categoryLookup?: Map<string, Category>) => {
      const sourceCategories = categoryLookup ?? categoryById;
      const categorySlug = post.category_id ? sourceCategories.get(post.category_id)?.slug ?? '' : '';
      const nextForm: EditorFormState = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: post.status,
        publish_at: toDatetimeLocal(post.publish_at),
        author_name: post.author_name ?? '',
        category: categorySlug,
        tags: post.tags?.join(', ') ?? '',
        meta_title: post.meta_title ?? '',
        meta_description: post.meta_description ?? '',
        og_image_url: post.og_image_url ?? '',
        canonical_url: post.canonical_url ?? ''
      };

      const nextJson = post.content_json ?? EMPTY_EDITOR_JSON;
      const nextHtml =
        (post.content_html && post.content_html.trim()) || (post.content_markdown ? `<p>${post.content_markdown}</p>` : '<p></p>');

      setActivePostId(post.id);
      setForm(nextForm);
      setContentJson(nextJson);
      setContentHtml(nextHtml);
      setContentText(post.excerpt ?? '');

      const nextFingerprint = JSON.stringify({
        form: nextForm,
        contentSignature: JSON.stringify(nextJson),
        contentHtml: nextHtml
      });
      lastSavedFingerprintRef.current = nextFingerprint;
      setSaveIndicator('idle');
      setSavedAt(null);
    },
    [categoryById]
  );

  const loadPosts = useCallback(
    async (syncPostId?: string | null) => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/posts', { cache: 'no-store' });
        const payload = (await response.json()) as PostsResponse;
        if (!response.ok) {
          setStatus(payload.error ?? 'Unable to load posts.');
          return;
        }

        const nextPosts = payload.posts ?? [];
        const nextCategories = payload.categories ?? [];
        setPosts(nextPosts);
        setCategories(nextCategories);
        setKnownTags(payload.tags ?? []);

        if (syncPostId) {
          const post = nextPosts.find((item) => item.id === syncPostId);
          if (post) {
            applyPostToEditor(post, new Map(nextCategories.map((category) => [category.id, category])));
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [applyPostToEditor]
  );

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const buildPayload = useCallback(
    (statusOverride?: PostStatus) => {
      const trimmedExcerpt = form.excerpt.trim();
      return {
        title: form.title.trim(),
        slug: normalizeSlug(form.slug),
        excerpt: trimmedExcerpt || contentText.trim().slice(0, 220),
        status: statusOverride ?? form.status,
        publish_at: toIsoOrNull(form.publish_at),
        author_name: form.author_name.trim(),
        category: form.category.trim(),
        tags: form.tags,
        meta_title: form.meta_title.trim(),
        meta_description: form.meta_description.trim(),
        og_image_url: form.og_image_url.trim(),
        canonical_url: form.canonical_url.trim(),
        content_json: contentJson,
        content_html: contentHtml
      };
    },
    [contentHtml, contentJson, contentText, form]
  );

  const savePost = useCallback(
    async (options?: { autosave?: boolean; statusOverride?: PostStatus }) => {
      const autosave = options?.autosave ?? false;
      const statusOverride = options?.statusOverride;
      const payload = buildPayload(statusOverride);

      if (!payload.title || !payload.slug || !payload.excerpt || !contentText.trim()) {
        if (!autosave) {
          setStatus('Title, slug, excerpt, and editor content are required.');
        }
        return null;
      }

      setSaving(true);
      setSaveIndicator('saving');
      if (!autosave) setStatus('');

      const currentPostId = activePostIdRef.current;
      const isUpdate = Boolean(currentPostId);
      const response = await fetch('/api/admin/posts', {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUpdate ? { ...payload, id: currentPostId } : payload)
      });

      const result = (await response.json()) as { error?: string; id?: string };
      setSaving(false);

      if (!response.ok) {
        setSaveIndicator('idle');
        if (!autosave) {
          setStatus(result.error ?? 'Unable to save post.');
        }
        return null;
      }

      const nextPostId = result.id ?? currentPostId;
      if (nextPostId) {
        setActivePostId(nextPostId);
        await loadPosts(nextPostId);
      } else {
        await loadPosts();
      }

      syncSaveFingerprint();
      if (!autosave) {
        setStatus(isUpdate ? 'Post updated.' : 'Post created.');
      }

      return nextPostId ?? null;
    },
    [buildPayload, contentText, loadPosts, syncSaveFingerprint]
  );

  useEffect(() => {
    if (!hasUnsavedChanges || saving) return;

    const timer = window.setTimeout(() => {
      void savePost({ autosave: true });
    }, 10_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasUnsavedChanges, savePost, saving]);

  const deletePost = async (id: string) => {
    setSaving(true);
    setStatus('');
    const response = await fetch(`/api/admin/posts?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to delete post.');
      return;
    }

    if (activePostIdRef.current === id) {
      resetToCreateMode();
    }
    setStatus('Post deleted.');
    await loadPosts();
  };

  const activePost = posts.find((post) => post.id === activePostId) ?? null;

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="mt-2 text-black/70">
          Create and edit blog posts with rich content, SEO metadata, and scheduled publishing.
        </p>
        <p className="mt-2 text-black/70">
          {posts.length} total posts, {publishedCount} public, {scheduledCount} scheduled.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={resetToCreateMode}>
            New Post
          </button>
          <Link href="/admin" className="btn-subtle">
            Back to Admin
          </Link>
          <Link href="/blog" className="btn-subtle">
            View Public Blog
          </Link>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="card space-y-3">
          <h2 className="text-lg font-semibold">Existing Posts</h2>
          {loading ? <p className="text-sm text-black/60">Loading posts...</p> : null}
          {!loading && posts.length === 0 ? <p className="text-sm text-black/60">No posts yet.</p> : null}
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => applyPostToEditor(post)}
                className={`w-full rounded-lg border p-3 text-left ${
                  activePostId === post.id ? 'border-[#99c53f] bg-[#f4f9ea]' : 'border-black/10 bg-white'
                }`}
              >
                <p className="text-sm font-semibold">{post.title}</p>
                <p className="mt-1 text-xs text-black/60">{post.slug}</p>
                <p className="mt-1 text-xs text-black/55">{post.status}</p>
              </button>
            ))}
          </div>
        </aside>

        <article className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{activePost ? `Edit: ${activePost.title}` : 'Create New Post'}</h2>
            <p className="text-xs text-black/60">
              {saveIndicator === 'saving'
                ? 'Saving...'
                : saveIndicator === 'saved'
                  ? `Saved${savedAt ? ` at ${savedAt}` : ''}`
                  : hasUnsavedChanges
                    ? 'Unsaved changes'
                    : 'No changes'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-black/20 p-2"
              placeholder="Title"
              required
            />
            <input
              name="slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
              className="rounded-lg border border-black/20 p-2"
              placeholder="slug"
              required
            />
            <input
              name="author_name"
              value={form.author_name}
              onChange={(event) => setForm((prev) => ({ ...prev, author_name: event.target.value }))}
              className="rounded-lg border border-black/20 p-2"
              placeholder="Author name"
            />
            <input
              name="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-lg border border-black/20 p-2"
              placeholder="Category"
            />
            <input
              name="tags"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="Tags separated by commas"
            />
            {knownTags.length > 0 ? (
              <p className="text-xs text-black/55 md:col-span-2">Known tags: {knownTags.map((tag) => tag.slug).join(', ')}</p>
            ) : null}
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="Excerpt"
              required
            />
            <select
              name="status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PostStatus }))}
              className="rounded-lg border border-black/20 p-2"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
            <input
              type="datetime-local"
              name="publish_at"
              value={form.publish_at}
              onChange={(event) => setForm((prev) => ({ ...prev, publish_at: event.target.value }))}
              className="rounded-lg border border-black/20 p-2"
            />
            <input
              name="meta_title"
              value={form.meta_title}
              onChange={(event) => setForm((prev) => ({ ...prev, meta_title: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="SEO meta title"
            />
            <textarea
              name="meta_description"
              value={form.meta_description}
              onChange={(event) => setForm((prev) => ({ ...prev, meta_description: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="SEO meta description"
            />
            <input
              name="og_image_url"
              value={form.og_image_url}
              onChange={(event) => setForm((prev) => ({ ...prev, og_image_url: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="OG image URL"
            />
            <input
              name="canonical_url"
              value={form.canonical_url}
              onChange={(event) => setForm((prev) => ({ ...prev, canonical_url: event.target.value }))}
              className="rounded-lg border border-black/20 p-2 md:col-span-2"
              placeholder="Canonical URL"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-black/55">Content editor</p>
            <TiptapEditor
              key={activePostId ?? 'new'}
              valueJson={contentJson}
              valueHtml={contentHtml}
              onChange={(value) => {
                setContentJson(value.json);
                setContentHtml(value.html);
                setContentText(value.text);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={saving} onClick={() => void savePost()}>
              {saving ? 'Saving...' : activePost ? 'Update Post' : 'Create Post'}
            </button>
            <button
              type="button"
              className="btn-subtle"
              disabled={saving}
              onClick={() => void savePost({ statusOverride: 'published' })}
            >
              Publish
            </button>
            <button
              type="button"
              className="btn-subtle"
              disabled={saving}
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  status: 'scheduled',
                  publish_at: toDatetimeLocal(new Date(Date.now() + 3600_000).toISOString())
                }));
                void savePost({ statusOverride: 'scheduled' });
              }}
            >
              Schedule +1h
            </button>
            <button
              type="button"
              className="btn-subtle"
              disabled={saving}
              onClick={() => {
                setForm((prev) => ({ ...prev, status: 'draft' }));
                void savePost({ statusOverride: 'draft' });
              }}
            >
              Move to Draft
            </button>
            {activePost ? (
              <button type="button" className="btn-subtle" disabled={saving} onClick={() => void deletePost(activePost.id)}>
                Delete
              </button>
            ) : null}
          </div>
        </article>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
