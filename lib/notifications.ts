import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType =
  | 'new_profile_submitted'
  | 'claim_requested'
  | 'change_requested'
  | 'profile_approved'
  | 'profile_rejected'
  | 'claim_approved'
  | 'claim_rejected'
  | 'change_approved'
  | 'change_rejected'
  | 'account_provisioned';

interface NotifyPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Notifies one specific user (e.g. an employee whose submission was just reviewed). Always called
 * with the service-role admin client — regular users have no insert policy on `notifications`
 * (migration 0024). Swallows and logs failures rather than throwing: a broken notification must
 * never block or roll back the real action it's attached to (same principle as
 * provisionEmployeeAccount's failure handling in lib/auth/provisionAccount.ts).
 */
export async function notifyUser(
  adminClient: SupabaseClient,
  userId: string,
  payload: NotifyPayload
): Promise<void> {
  const { error } = await adminClient.from('notifications').insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link ?? null,
  });
  if (error) console.error('Failed to insert notification:', error);
}

/**
 * Notifies every Super Admin and CV Reviewer — the maker-checker approval queue's reviewers
 * (docs/04-rbac-security.md §12) — used when something new lands in /review.
 */
export async function notifyReviewers(adminClient: SupabaseClient, payload: NotifyPayload): Promise<void> {
  const { data: reviewers, error } = await adminClient
    .from('user_roles')
    .select('user_id')
    .in('role', ['super_admin', 'cv_reviewer']);

  if (error) {
    console.error('Failed to look up reviewers for notification:', error);
    return;
  }
  if (!reviewers || reviewers.length === 0) return;

  const rows = reviewers.map((r: { user_id: string }) => ({
    user_id: r.user_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link ?? null,
  }));

  const { error: insertError } = await adminClient.from('notifications').insert(rows);
  if (insertError) console.error('Failed to insert reviewer notifications:', insertError);
}
