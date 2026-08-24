import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationType } from '@/lib/notifications';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const SELECT = 'id, type, title, message, link, is_read, created_at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/** RLS (`notifications_select_own`) already scopes this to the caller's own rows. */
export async function listNotifications(supabase: SupabaseClient, limit: number | null = 30): Promise<AppNotification[]> {
  let query = supabase
    .from('notifications')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (limit != null) query = query.limit(limit);
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}
