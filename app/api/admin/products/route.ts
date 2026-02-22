import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireAdminApi } from '@/lib/supabase/guards';

type ProductPayload = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  landing_url?: string;
  logo_url?: string;
  status?: 'draft' | 'live';
  sort_order?: number;
};

export async function GET() {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const { data, error } = await supabase
    .from('products')
    .select('id,name,slug,description,short_description,landing_url,logo_url,status,sort_order,created_at,updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as ProductPayload;

  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();
  const description = (body.description ?? body.short_description)?.trim();
  const shortDescription = body.short_description?.trim() || description;

  if (!name || !slug || !description) {
    return NextResponse.json({ error: 'name, slug, and description are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      slug,
      description,
      short_description: shortDescription,
      landing_url: body.landing_url?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      status: body.status ?? 'draft',
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 100
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'product.created',
    actionType: body.status === 'live' ? 'product.published' : 'product.created',
    targetTable: 'products',
    targetId: data.id,
    details: { slug }
  });

  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as ProductPayload;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id is required for updates.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (body.name) updatePayload.name = body.name.trim();
  if (body.slug) updatePayload.slug = body.slug.trim().toLowerCase();

  if (typeof body.description === 'string') {
    const description = body.description.trim();
    updatePayload.description = description;
    if (typeof body.short_description !== 'string') {
      updatePayload.short_description = description;
    }
  }

  if (typeof body.short_description === 'string') {
    updatePayload.short_description = body.short_description.trim();
  }

  if (typeof body.landing_url === 'string') updatePayload.landing_url = body.landing_url.trim() || null;
  if (typeof body.logo_url === 'string') updatePayload.logo_url = body.logo_url.trim() || null;
  if (body.status) updatePayload.status = body.status;
  if (typeof body.sort_order === 'number') updatePayload.sort_order = body.sort_order;

  const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'product.updated',
    actionType:
      body.status === 'live'
        ? 'product.published'
        : body.status === 'draft'
          ? 'product.unpublished'
          : 'product.updated',
    targetTable: 'products',
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

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'product.deleted',
    targetTable: 'products',
    targetId: id
  });

  return NextResponse.json({ ok: true });
}
