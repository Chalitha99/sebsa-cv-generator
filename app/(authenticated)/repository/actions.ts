'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteEmployee } from '@/services/employee-service';
import { getCurrentUser } from '@/lib/auth';
import { recordAuditLog } from '@/services/audit-service';

export async function deleteEmployeeAction(rowId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  const supabase = await createClient();
  await deleteEmployee(supabase, rowId);
  await recordAuditLog({ actorId: user.id, action: 'DELETE', entityType: 'employee_profile', entityId: rowId });
  revalidatePath('/repository');
  revalidatePath('/dashboard');
}
