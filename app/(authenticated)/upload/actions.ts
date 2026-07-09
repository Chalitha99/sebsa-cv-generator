'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createEmployee } from '@/services/employee-service';
import type { CreateEmployeeInput } from '@/types/domain';

export async function createEmployeeAction(input: CreateEmployeeInput): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  const rowId = await createEmployee(supabase, input, user.id);
  revalidatePath('/repository');
  revalidatePath('/dashboard');
  return rowId;
}
