'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { notifyReviewers } from '@/lib/notifications';
import type { CreateEmployeeInput } from '@/types/domain';
import type { CvExperienceEntry, CvAcademicEntry, CvProjectEntry, CvCertificationEntry } from '@/lib/cvTypes';

/** Everything an employee may propose changing about their own profile — all fields except the
 *  mandatory, locked ones (name, work email), which the server fills in itself below. */
export interface ProfileChangeSubmission {
  role: string;
  department: string;
  skills: string[];
  cvExperience: CvExperienceEntry[];
  cvAcademic: CvAcademicEntry[];
  specialProjects: CvProjectEntry[];
  cvCertifications: CvCertificationEntry[];
  /** Omit to leave the current photo unchanged — updateEmployee only touches avatar_url when set. */
  avatarUrl?: string;
}

/**
 * Employee self-edit of an already-published profile (docs/04-rbac-security.md §10). Stages the
 * proposed values in `pending_change` rather than writing them live — a Super Admin/CV Reviewer
 * must approve (app/(authenticated)/review/actions.ts) before they take effect. Uses the
 * RLS-bound client: profiles_self_propose_change (0020) is the real enforcement — it only allows
 * touching the caller's own row, and only while status='published'.
 *
 * name/email are deliberately NOT accepted from the client — they're read from the current row
 * server-side so `pending_change` is always a complete, valid CreateEmployeeInput ready for
 * updateEmployee() at approval time, and so an employee can never smuggle a name/email change
 * through this path (docs/04-rbac-security.md's "mandatory fields stay locked" requirement).
 */
export async function proposeProfileChangeAction(change: ProfileChangeSubmission): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (user.role !== 'employee') throw new Error('Only Employee accounts propose changes this way.');
  if (!user.hasLinkedProfile || !user.profileId) throw new Error('You do not have a profile yet.');

  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('user_id', user.id)
    .single();
  if (currentError) throw currentError;

  const fullChange: CreateEmployeeInput = {
    name: current.full_name as string,
    email: current.email as string,
    role: change.role,
    department: change.department,
    skills: change.skills,
    currentPosition: change.role,
    cvExperience: change.cvExperience,
    cvAcademic: change.cvAcademic,
    specialProjects: change.specialProjects,
    cvCertifications: change.cvCertifications,
    avatarUrl: change.avatarUrl,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      pending_change: fullChange,
      pending_change_submitted_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'published');

  if (error) throw error;

  await notifyReviewers(createAdminClient(), {
    type: 'change_requested',
    title: 'Profile update requested',
    message: `${current.full_name} proposed changes to their profile.`,
    link: '/review',
  });

  revalidatePath(`/repository/${user.profileId}`);
  revalidatePath('/my-profile');
}
