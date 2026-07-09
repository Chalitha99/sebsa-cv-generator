'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteEmployee } from '@/services/employee-service';

export async function deleteEmployeeAction(rowId: string): Promise<void> {
  const supabase = await createClient();
  await deleteEmployee(supabase, rowId);
  revalidatePath('/repository');
  revalidatePath('/dashboard');
}
