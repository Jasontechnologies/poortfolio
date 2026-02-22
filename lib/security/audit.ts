import type { SupabaseClient } from '@supabase/supabase-js';

type AuditEntry = {
  actorId: string;
  actorRole: string;
  action: string;
  actionType?: string;
  targetTable?: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
};

export async function logAuditEvent(supabase: SupabaseClient, entry: AuditEntry) {
  await supabase.from('audit_log').insert({
    action_type: entry.actionType ?? entry.action,
    actor_user_id: entry.actorId,
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    action: entry.action,
    target_type: entry.targetType ?? entry.targetTable ?? null,
    target_table: entry.targetTable ?? null,
    target_id: entry.targetId ?? null,
    metadata: entry.details ?? {},
    details: entry.details ?? {}
  });
}
