import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireAdminApi } from '@/lib/supabase/guards';

type UpdatePayload = {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string;
  content_markdown?: string;
  status?: 'draft' | 'published';
  published_at?: string | null;
};

export async function GET() {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const { data, error } = await supabase
    .from('updates')
    .select('id,title,slug,summary,content_markdown,status,published_at,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ updates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as UpdatePayload;
  const title = body.title?.trim();
  const slug = body.slug?.trim().toLowerCase();
  const summary = body.summary?.trim();
  const contentMarkdown = body.content_markdown?.trim();

  if (!title || !slug || !summary || !contentMarkdown) {
    return NextResponse.json(
      { error: 'title, slug, summary, and content_markdown are required.' },
      { status: 400 }
    );
  }

  const status = body.status ?? 'draft';
  const publishedAt = status === 'published' ? body.published_at ?? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('updates')
    .insert({
      title,
      slug,
      summary,
      content_markdown: contentMarkdown,
      status,
      published_at: publishedAt,
      created_by: authContext.user.id,
      updated_by: authContext.user.id
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'update.created',
    actionType: status === 'published' ? 'update.published' : 'update.created',
    targetTable: 'updates',
    targetId: data.id,
    details: { slug, status }
  });

  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as UpdatePayload;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_by: authContext.user.id
  };

  if (body.title) updatePayload.title = body.title.trim();
  if (body.slug) updatePayload.slug = body.slug.trim().toLowerCase();
  if (body.summary) updatePayload.summary = body.summary.trim();
  if (body.content_markdown) updatePayload.content_markdown = body.content_markdown.trim();
  if (body.status) {
    updatePayload.status = body.status;
    updatePayload.published_at =
      body.status === 'published' ? body.published_at ?? new Date().toISOString() : null;
  } else if (typeof body.published_at !== 'undefined') {
    updatePayload.published_at = body.published_at;
  }

  const { error } = await supabase.from('updates').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const actionType =
    body.status === 'published'
      ? 'update.published'
      : body.status === 'draft'
        ? 'update.unpublished'
        : 'update.updated';

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'update.updated',
    actionType,
    targetTable: 'updates',
    targetId: id,
    details: updatePayload
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('updates').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'update.deleted',
    actionType: 'update.deleted',
    targetTable: 'updates',
    targetId: id
  });

  return NextResponse.json({ ok: true });
}
