import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireSuperAdminApi } from '@/lib/supabase/guards';
import { upsertFeatureFlag } from '@/lib/supabase/feature-flags';
import type { FeatureFlagKey } from '@/lib/supabase/feature-flags';

type FeatureFlagPayload = {
  key?: string;
  enabled?: boolean;
};

const MANAGED_FLAGS = new Set([
  'chat_enabled',
  'signup_enabled',
  'products_enabled',
  'blog_enabled',
  'analytics_enabled'
]);

export async function GET() {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key,enabled,updated_by,updated_at')
    .order('key', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ flags: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as FeatureFlagPayload;
  const key = body.key?.trim();

  if (!key || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'key and enabled are required.' }, { status: 400 });
  }

  if (!MANAGED_FLAGS.has(key)) {
    return NextResponse.json({ error: 'Unsupported feature flag key.' }, { status: 400 });
  }

  try {
    await upsertFeatureFlag(supabase, key as FeatureFlagKey, body.enabled, authContext.user.id);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'feature_flag.updated',
    actionType: 'feature_flag.updated',
    targetTable: 'feature_flags',
    targetId: key,
    details: { key, enabled: body.enabled }
  });

  return NextResponse.json({ ok: true });
}
