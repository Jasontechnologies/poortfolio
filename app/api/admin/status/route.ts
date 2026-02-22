import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/security/audit';
import { requireAdminApi } from '@/lib/supabase/guards';

type StatusPayload = {
  kind?: 'system' | 'incident';
  id?: string;
  current_status?: 'operational' | 'degraded' | 'outage' | 'maintenance';
  message?: string;
  title?: string;
  details?: string;
  severity?: 'info' | 'minor' | 'major' | 'critical';
  status?: 'open' | 'resolved';
  incident_date?: string;
  resolved_at?: string | null;
  published?: boolean;
};

export async function GET() {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase } = guard;
  const [{ data: systemStatus, error: systemError }, { data: incidents, error: incidentsError }] =
    await Promise.all([
      supabase
        .from('system_status')
        .select('id,current_status,message,updated_by,updated_at')
        .eq('id', true)
        .maybeSingle(),
      supabase
        .from('status_incidents')
        .select('id,title,details,severity,status,published,incident_date,resolved_at,created_at,updated_at')
        .order('incident_date', { ascending: false })
        .limit(100)
    ]);

  if (systemError) {
    return NextResponse.json({ error: systemError.message }, { status: 400 });
  }

  if (incidentsError) {
    return NextResponse.json({ error: incidentsError.message }, { status: 400 });
  }

  return NextResponse.json({
    systemStatus,
    incidents: incidents ?? []
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as StatusPayload;

  const title = body.title?.trim();
  const details = body.details?.trim();
  if (!title || !details) {
    return NextResponse.json({ error: 'title and details are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('status_incidents')
    .insert({
      title,
      details,
      severity: body.severity ?? 'minor',
      status: body.status ?? 'open',
      published: Boolean(body.published),
      incident_date: body.incident_date ?? new Date().toISOString(),
      resolved_at: body.status === 'resolved' ? body.resolved_at ?? new Date().toISOString() : null,
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
    action: 'status_incident.created',
    actionType: body.published ? 'status_incident.published' : 'status_incident.created',
    targetTable: 'status_incidents',
    targetId: data.id,
    details: {
      severity: body.severity ?? 'minor',
      status: body.status ?? 'open',
      published: Boolean(body.published)
    }
  });

  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if ('response' in guard) return guard.response;

  const { supabase, authContext } = guard;
  const body = (await request.json()) as StatusPayload;

  if (body.kind === 'system') {
    if (!body.current_status) {
      return NextResponse.json({ error: 'current_status is required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('system_status')
      .update({
        current_status: body.current_status,
        message: body.message?.trim() || null,
        updated_by: authContext.user.id
      })
      .eq('id', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAuditEvent(supabase, {
      actorId: authContext.user.id,
      actorRole: authContext.role,
      action: 'system_status.updated',
      actionType: 'system_status.updated',
      targetTable: 'system_status',
      targetId: 'true',
      details: {
        current_status: body.current_status
      }
    });

    return NextResponse.json({ ok: true });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required for incident updates.' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_by: authContext.user.id
  };
  if (body.title) updatePayload.title = body.title.trim();
  if (body.details) updatePayload.details = body.details.trim();
  if (body.severity) updatePayload.severity = body.severity;
  if (body.status) {
    updatePayload.status = body.status;
    if (body.status === 'resolved') {
      updatePayload.resolved_at = body.resolved_at ?? new Date().toISOString();
    }
  }
  if (typeof body.published === 'boolean') updatePayload.published = body.published;
  if (body.incident_date) updatePayload.incident_date = body.incident_date;
  if (typeof body.resolved_at !== 'undefined') updatePayload.resolved_at = body.resolved_at;

  const { error } = await supabase.from('status_incidents').update(updatePayload).eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'status_incident.updated',
    actionType:
      typeof body.published === 'boolean'
        ? body.published
          ? 'status_incident.published'
          : 'status_incident.unpublished'
        : 'status_incident.updated',
    targetTable: 'status_incidents',
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

  const { error } = await supabase.from('status_incidents').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    actorId: authContext.user.id,
    actorRole: authContext.role,
    action: 'status_incident.deleted',
    actionType: 'status_incident.deleted',
    targetTable: 'status_incidents',
    targetId: id
  });

  return NextResponse.json({ ok: true });
}
