import type { SupabaseClient, User } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export interface ProvisionResult {
  userId: string;
  /** True if a brand-new account was created and an invite email sent; false if an account for
   *  this email already existed and was linked instead (e.g. the employee self-registered via
   *  /signup before an Admin got to uploading their CV). */
  invited: boolean;
}

/**
 * Creates a Supabase Auth account for an employee being added by an Admin/Super Admin/CV
 * Reviewer and emails them a secure one-time invite link (Supabase's built-in
 * admin.inviteUserByEmail — no password ever exists in the email; the employee sets their own on
 * first login via /auth/set-password). See docs/04-rbac-security.md §14.
 *
 * If an account for this email already exists (the employee self-registered first, or a prior
 * invite already created it), links to that account instead of erroring — this is a legitimate,
 * expected race condition, not a failure.
 *
 * Throws only when account creation genuinely fails for a reason other than "already exists"
 * (e.g. email sending misconfigured) — callers should treat that as non-fatal to profile
 * creation itself (see createEmployeeAction) since the old self-service claim flow (0019/0020)
 * remains a fallback: the employee can still self-register and request to link the profile.
 */
export async function provisionEmployeeAccount(
  adminClient: SupabaseClient,
  email: string
): Promise<ProvisionResult> {
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password`;

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (!error && data.user) {
    return { userId: data.user.id, invited: true };
  }

  // "already registered" (exact message varies by Supabase version) — look up the existing
  // account instead of treating this as a failure.
  const alreadyExists = /already.*registered|already.*exists/i.test(error?.message ?? '');
  if (!alreadyExists) {
    throw new Error(error?.message ?? `Failed to invite ${email}.`);
  }

  const listResult = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listResult.error) throw listResult.error;

  // The success/error branches of listUsers()'s return type don't discriminate cleanly through
  // the `.data.users: User[] & Pagination | []` intersection, so TS can't narrow it on its own
  // past the `error` check above — cast explicitly since we've already ruled out the error case.
  const users = listResult.data.users as User[];
  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    // Shouldn't happen (Supabase just told us this email is taken), but don't silently swallow it.
    throw new Error(`${email} is already registered, but no matching account could be found.`);
  }

  return { userId: existing.id, invited: false };
}
