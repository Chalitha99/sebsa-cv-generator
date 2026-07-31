'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, canAssignRole, isAdminOrAbove, type UserRole } from '@/lib/auth';

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Admin/Super Admin/CV Reviewer only (matches user_roles_select RLS — everyone at
 * reviewer-or-above can see the roster; only admin-or-above can change roles, enforced both
 * here and by the user_roles_write RLS policy as the real backstop).
 */
export async function listUsersAction(): Promise<ManagedUser[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');

  const supabase = await createClient();
  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at');
  if (roleError) throw roleError;

  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) throw authError;

  const emailById = new Map<string, string>(
    authData.users.map((u): [string, string] => [u.id, u.email ?? '(no email)'])
  );

  const managedUsers: ManagedUser[] = (roleRows ?? []).map(
    (row: { user_id: string; role: string; created_at: string }): ManagedUser => ({
      id: row.user_id,
      email: emailById.get(row.user_id) ?? '(unknown)',
      role: row.role as UserRole,
      createdAt: row.created_at,
    })
  );

  return managedUsers.sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Changes another user's role. Uses the RLS-bound server client (not the admin client) so the
 * user_roles_write policy's grant hierarchy is the actual enforcement — this function's checks
 * are just a friendlier error message before hitting the database.
 */
export async function updateUserRoleAction(targetUserId: string, newRole: UserRole): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');
  if (!isAdminOrAbove(currentUser.role)) {
    throw new Error('Unauthorized: Admin or Super Admin role required.');
  }
  if (!canAssignRole(currentUser.role, newRole)) {
    throw new Error(`Unauthorized: your role cannot assign "${newRole}".`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('user_id', targetUserId);

  if (error) throw error;
  revalidatePath('/settings');
}
