import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminApi } from '@/lib/supabase/guards';

export async function GET(request: NextRequest) {
  const guard = await requireSuperAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '25')));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const actionType = request.nextUrl.searchParams.get('actionType')?.trim();

  let query = supabase
    .from('audit_log')
    .select('id,action_type,action,actor_user_id,actor_id,actor_role,target_type,target_table,target_id,metadata,details,created_at', {
      count: 'exact'
    })
    .order('created_at', { ascending: false });

  if (actionType) {
    query = query.eq('action_type', actionType);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    events: data ?? [],
    pagination: {
      page,
      pageSize,
      total: count ?? 0
    }
  });
}
