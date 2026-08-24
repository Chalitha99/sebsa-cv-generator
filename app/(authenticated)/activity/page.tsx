import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listNotifications } from '@/services/notification-service';
import { getCurrentUser } from '@/lib/auth';
import ActivityLogClient from './ActivityLogClient';
import { listAuditLogs } from '@/services/audit-service';

/**
 * Unlike the old Dashboard-only "system activity" panel, this is every user's OWN notification
 * history (RLS-scoped, notifications_select_own) — an Employee gets approval/rejection
 * notifications just as much as a reviewer gets "new submission" ones, so this is open to any
 * authenticated, onboarded user, not just Admin/Super Admin.
 */
export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [{ tab }, notifications, auditLogs] = await Promise.all([
    searchParams,
    listNotifications(supabase, null),
    listAuditLogs(supabase),
  ]);

  return <ActivityLogClient initialNotifications={notifications} initialAuditLogs={auditLogs} initialTab={tab === 'notifications' ? 'notifications' : 'activity'} />;
}
