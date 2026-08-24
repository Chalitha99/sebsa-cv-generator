'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmployeeById, updateEmployee } from '@/services/employee-service';
import { getCurrentUser, isAdminOrAbove } from '@/lib/auth';
import type { CreateEmployeeInput, Employee } from '@/types/domain';
import { changedFields, recordAuditLog } from '@/services/audit-service';

/**
 * Loads the complete detailed profile of a selected employee by their profile id.
 */
export async function getEmployeeDetailsAction(profileId: string): Promise<Employee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  return getEmployeeById(supabase, profileId);
}

/**
 * Saves the updated profile details back to the database.
 * Uses service-role client to bypass RLS checks for editing.
 */
export async function updateEmployeeAction(
  profileId: string,
  input: CreateEmployeeInput
): Promise<void> {
  // This uses the service-role client below (bypasses RLS), so this role check is the actual
  // enforcement boundary, not just a friendlier error message. Previously this only checked for
  // *any* authenticated session, which let any signed-in user — including role 'employee' —
  // edit an arbitrary profile by id.
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (!isAdminOrAbove(user.role)) {
    throw new Error('Unauthorized: Admin or Super Admin role required.');
  }

  const adminClient = createAdminClient();
  const current = await getEmployeeById(adminClient, profileId);
  await updateEmployee(adminClient, profileId, input, user.id);
  await recordAuditLog({
    actorId: user.id,
    action: 'UPDATE',
    entityType: 'employee_profile',
    entityId: profileId,
    metadata: { changed_fields: current ? changedFields(current as unknown as Record<string, unknown>, input as unknown as Record<string, unknown>) : Object.keys(input) },
  });

  revalidatePath('/repository');
  revalidatePath('/dashboard');
}
