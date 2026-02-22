import { NextRequest, NextResponse } from 'next/server';
import type { JSONContent } from '@tiptap/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { markdownToHtml } from '@/lib/content/markdown';
import { htmlToPlainText, sanitizePostHtml } from '@/lib/content/sanitize';
import { logAuditEvent } from '@/lib/security/audit';
import { requireAdminApi } from '@/lib/supabase/guards';

type PostStatus = 'draft' | 'scheduled' | 'published';

type PostPayload = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content_markdown?: string;
  content_json?: JSONContent | null;
  content_html?: string;
  cover_image_url?: string;
  status?: PostStatus;
  publish_at?: string | null;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  canonical_url?: string;
  author_name?: string;
  tags?: string[] | string;
  category?: string;
};

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseTagList(input: PostPayload['tags']) {
  const source = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : [];
  return source
    .map((tag) => normalizeSlug(String(tag)))
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizeContent(body: PostPayload) {
  const rawHtml =
    typeof body.content_html === 'string' && body.content_html.trim()
      ? body.content_html
      : typeof body.content_markdown === 'string' && body.content_markdown.trim()
        ? markdownToHtml(body.content_markdown)
        : '';

  const cleanHtml = sanitizePostHtml(rawHtml);
  const plainText = htmlToPlainText(cleanHtml);
  const contentJson = body.content_json ?? { type: 'doc', content: [{ type: 'paragraph' }] };

  if (!plainText) {
    throw new Error('Post content is required.');
  }

  return {
    contentHtml: cleanHtml,
    contentJson,
    contentMarkdown: plainText
  };
}

async function upsertCategory(supabase: SupabaseClient, categoryName?: string) {
  const normalized = categoryName ? normalizeSlug(categoryName) : '';
  if (!normalized) return null;

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', normalized)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const readableName = categoryName?.trim() || normalized;
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: readableName,
      slug: normalized
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function syncTagsForPost(supabase: SupabaseClient, postId: string, tags: string[]) {
  await supabase.from('post_tags').delete().eq('post_id', postId);
  if (tags.length === 0) return;

  const upsertRows = tags.map((tag) => ({
    slug: tag,
    name: tag
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }));

  const { data: upsertedTags, error: upsertError } = await supabase
    .from('tags')
    .upsert(upsertRows, { onConflict: 'slug' })
    .select('id,slug');

  if (upsertError) {
    throw upsertError;
  }

  const tagRows = upsertedTags ?? [];
  if (tagRows.length === 0) return;

  const joinRows = tagRows.map((tag: { id: string }) => ({
    post_id: postId,
    tag_id: tag.id
  }));

  const { error: joinError } = await supabase.from('post_tags').insert(joinRows);
  if (joinError) {
    throw joinError;
  }
}

function resolvePublishColumns(status: PostStatus, publishAt?: string | null) {
  if (status === 'draft') {
    return {
      publish_at: null,
      published_at: null
    };
  }

  if (status === 'published') {
    const date = publishAt ?? new Date().toISOString();
    return {
      publish_at: date,
      published_at: date
    };
  }

  return {
    publish_at: publishAt ?? null,
    published_at: null
  };
}

async function ensureUniqueSlug(supabase: SupabaseClient, slug: string, excludePostId?: string) {
  let query = supabase.from('posts').select('id').eq('slug', slug).limit(1);
  if (excludePostId) {
    query = query.neq('id', excludePostId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return !data;
}

export async function GET() {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const [{ data: posts, error: postsError }, { data: categories, error: categoriesError }, { data: tags, error: tagsError }] =
    await Promise.all([
      supabase
        .from('posts')
        .select(
          'id,title,slug,excerpt,content_markdown,content_json,content_html,status,published_at,publish_at,tags,author_name,meta_title,meta_description,og_image_url,canonical_url,category_id,created_at,updated_at'
        )
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug').order('name', { ascending: true }),
      supabase.from('tags').select('id,name,slug').order('name', { ascending: true })
    ]);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 400 });
  }

  if (categoriesError) {
    return NextResponse.json({ error: categoriesError.message }, { status: 400 });
  }

  if (tagsError) {
    return NextResponse.json({ error: tagsError.message }, { status: 400 });
  }

  return NextResponse.json({
    posts: posts ?? [],
    categories: categories ?? [],
    tags: tags ?? []
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as PostPayload;
  const title = body.title?.trim();
  const slug = body.slug ? normalizeSlug(body.slug) : '';
  const excerpt = body.excerpt?.trim();

  if (!title || !slug || !excerpt) {
    return NextResponse.json({ error: 'title, slug, and excerpt are required.' }, { status: 400 });
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only.' }, { status: 400 });
  }

  const status = body.status ?? 'draft';
  if (status === 'scheduled' && !body.publish_at) {
    return NextResponse.json({ error: 'publish_at is required for scheduled posts.' }, { status: 400 });
  }

  try {
    const slugAvailable = await ensureUniqueSlug(supabase, slug);
    if (!slugAvailable) {
      return NextResponse.json({ error: 'Slug is already in use.' }, { status: 409 });
    }

    const categoryId = await upsertCategory(supabase, body.category);
    const tags = parseTagList(body.tags);
    const publishColumns = resolvePublishColumns(status, body.publish_at);
    const content = sanitizeContent(body);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        slug,
        excerpt,
        content_markdown: content.contentMarkdown,
        content_json: content.contentJson,
        content_html: content.contentHtml,
        cover_image_url: body.cover_image_url?.trim() || null,
        status,
        ...publishColumns,
        tags,
        category_id: categoryId,
        meta_title: body.meta_title?.trim() || null,
        meta_description: body.meta_description?.trim() || null,
        og_image_url: body.og_image_url?.trim() || null,
        canonical_url: body.canonical_url?.trim() || null,
        author_id: authContext.user.id,
        author_name: body.author_name?.trim() || null
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await syncTagsForPost(supabase, data.id, tags);

    await logAuditEvent(supabase, {
      actorId: authContext.user.id,
      actorRole: authContext.role,
      action: 'post.created',
      actionType:
        status === 'published'
          ? 'post.published'
          : status === 'scheduled'
            ? 'post.scheduled'
            : 'post.created',
      targetTable: 'posts',
      targetId: data.id,
      details: { slug, status, tags, categoryId }
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as PostPayload;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id is required for updates.' }, { status: 400 });
  }

  try {
    const updatePayload: Record<string, unknown> = {};
    if (typeof body.title === 'string') updatePayload.title = body.title.trim();
    if (typeof body.excerpt === 'string') updatePayload.excerpt = body.excerpt.trim();
    if (typeof body.cover_image_url === 'string') updatePayload.cover_image_url = body.cover_image_url.trim() || null;
    if (typeof body.meta_title === 'string') updatePayload.meta_title = body.meta_title.trim() || null;
    if (typeof body.meta_description === 'string') updatePayload.meta_description = body.meta_description.trim() || null;
    if (typeof body.og_image_url === 'string') updatePayload.og_image_url = body.og_image_url.trim() || null;
    if (typeof body.canonical_url === 'string') updatePayload.canonical_url = body.canonical_url.trim() || null;
    if (typeof body.author_name === 'string') updatePayload.author_name = body.author_name.trim() || null;

    if (typeof body.slug === 'string') {
      const slug = normalizeSlug(body.slug);
      if (!isValidSlug(slug)) {
        return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only.' }, { status: 400 });
      }

      const slugAvailable = await ensureUniqueSlug(supabase, slug, id);
      if (!slugAvailable) {
        return NextResponse.json({ error: 'Slug is already in use.' }, { status: 409 });
      }
      updatePayload.slug = slug;
    }

    if (
      typeof body.content_html === 'string' ||
      typeof body.content_markdown === 'string' ||
      typeof body.content_json === 'object'
    ) {
      const content = sanitizeContent(body);
      updatePayload.content_html = content.contentHtml;
      updatePayload.content_json = content.contentJson;
      updatePayload.content_markdown = content.contentMarkdown;
    }

    let statusValue: PostStatus | null = null;
    if (body.status) {
      statusValue = body.status;
      if (statusValue === 'scheduled' && !body.publish_at) {
        return NextResponse.json({ error: 'publish_at is required for scheduled posts.' }, { status: 400 });
      }
      updatePayload.status = statusValue;
      Object.assign(updatePayload, resolvePublishColumns(statusValue, body.publish_at));
    } else if (typeof body.publish_at !== 'undefined') {
      updatePayload.publish_at = body.publish_at;
    }

    if (typeof body.category === 'string') {
      const categoryId = await upsertCategory(supabase, body.category);
      updatePayload.category_id = categoryId;
    }

    if (typeof body.tags !== 'undefined') {
      const tags = parseTagList(body.tags);
      updatePayload.tags = tags;
      await syncTagsForPost(supabase, id, tags);
    }

    const { error } = await supabase.from('posts').update(updatePayload).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const actionType =
      statusValue === 'published'
        ? 'post.published'
        : statusValue === 'draft'
          ? 'post.unpublished'
          : statusValue === 'scheduled'
            ? 'post.scheduled'
            : 'post.updated';

    await logAuditEvent(supabase, {
      actorId: authContext.user.id,
      actorRole: authContext.role,
      action: 'post.updated',
      actionType,
      targetTable: 'posts',
      targetId: id,
      details: updatePayload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'post.deleted',
    actionType: 'post.deleted',
    targetTable: 'posts',
    targetId: id
  });

  return NextResponse.json({ ok: true });
}
