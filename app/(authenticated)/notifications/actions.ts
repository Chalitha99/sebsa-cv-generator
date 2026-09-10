'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/services/notification-service';

export async function listNotificationsAction(): Promise<AppNotification[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  return listNotifications(supabase);
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  const supabase = await createClient();
  await markNotificationRead(supabase, id);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  const supabase = await createClient();
  await markAllNotificationsRead(supabase, user.id);
}
