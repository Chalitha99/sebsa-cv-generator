import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'DOWNLOAD' | 'APPROVE' | 'REJECT';
export type AuditMetadata = Record<string, unknown>;

export interface AuditEvent {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: AuditMetadata;
}

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: AuditMetadata;
  createdAt: string;
}

/** Reads all audit rows visible under the caller's existing RLS policy. */
export async function listAuditLogs(
  supabase: SupabaseClient,
  limit?: number
): Promise<AuditLogRecord[]> {
  let query = supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at')
    .order('created_at', { ascending: false });
  if (limit != null) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  const actorIds = [...new Set((data ?? []).map((row) => row.actor_id as string | null).filter((id): id is string => Boolean(id)))];
  const namesByUserId = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', actorIds);
    if (profileError) throw profileError;
    for (const profile of profiles ?? []) {
      if (profile.user_id && profile.full_name) namesByUserId.set(profile.user_id as string, profile.full_name as string);
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    actorId: row.actor_id as string | null,
    actorName: row.actor_id ? namesByUserId.get(row.actor_id as string) ?? 'Unknown User' : 'System',
    action: row.action as string,
    entityType: row.entity_type as string | null,
    entityId: row.entity_id as string | null,
    metadata: (row.metadata ?? {}) as AuditMetadata,
    createdAt: row.created_at as string,
  }));
}

/**
 * The single append-only audit writer for backend code. It deliberately uses the server-only
 * service client because authenticated users have no audit_logs INSERT/UPDATE/DELETE policies.
 * Call this only after the corresponding business operation succeeds.
 */
export async function recordAuditLog(event: AuditEvent): Promise<void> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: event.actorId,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.error('Failed to append audit log', { event, error: error.message });
    throw new Error('The operation succeeded, but its audit entry could not be recorded.');
  }
}

/** Returns top-level business fields whose submitted values differ from the current values. */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  return Object.keys(after).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}
