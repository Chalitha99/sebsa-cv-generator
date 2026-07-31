'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmployeeByCode, updateEmployee } from '@/services/employee-service';
import { getCurrentUser, isAdminOrAbove } from '@/lib/auth';
import type { CreateEmployeeInput, Employee } from '@/types/domain';

/**
 * Loads the complete detailed profile of a selected employee by their code.
 */
export async function getEmployeeDetailsAction(employeeCode: string): Promise<Employee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  // Clean employee code
  const cleanCode = employeeCode.replace('#', '').toUpperCase();
  return getEmployeeByCode(supabase, cleanCode);
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
  await updateEmployee(adminClient, profileId, input, user.id);

  revalidatePath('/repository');
  revalidatePath('/dashboard');
}
