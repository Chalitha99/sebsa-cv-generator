'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import type { ProfileCoreChange } from '@/repositories/employee-repository';

/**
 * Employee self-edit of an already-published profile (docs/04-rbac-security.md §10). Stages the
 * proposed values in `pending_change` rather than writing them live — a Super Admin/CV Reviewer
 * must approve (app/(authenticated)/review/actions.ts) before they take effect. Uses the
 * RLS-bound client: profiles_self_propose_change (0020) is the real enforcement — it only allows
 * touching the caller's own row, and only while status='published'.
 */
export async function proposeProfileChangeAction(change: ProfileCoreChange): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (user.role !== 'employee') throw new Error('Only Employee accounts propose changes this way.');
  if (!user.hasLinkedProfile || !user.employeeCode) throw new Error('You do not have a profile yet.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      pending_change: change,
      pending_change_submitted_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'published');

  if (error) throw error;

  revalidatePath(`/repository/${user.employeeCode}`);
  revalidatePath('/my-profile');
}
