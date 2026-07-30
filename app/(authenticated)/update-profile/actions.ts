'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmployeeByCode, updateEmployee } from '@/services/employee-service';
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  const adminClient = createAdminClient();
  await updateEmployee(adminClient, profileId, input, user.id);

  revalidatePath('/repository');
  revalidatePath('/dashboard');
}
