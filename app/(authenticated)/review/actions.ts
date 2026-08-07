'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isReviewerOrAbove, type CurrentUser } from '@/lib/auth';
import { updateEmployee } from '@/services/employee-service';
import type { CreateEmployeeInput } from '@/types/domain';

export type PendingItemType = 'new_profile' | 'claim' | 'change';

export interface PendingItem {
  profileId: string;
  name: string;
  email: string;
  type: PendingItemType;
  submittedAt: string;
  proposedChange?: CreateEmployeeInput;
}

async function requireReviewer(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (!isReviewerOrAbove(user.role)) {
    throw new Error('Unauthorized: Admin, Super Admin, or CV Reviewer role required.');
  }
  return user;
}

function revalidateAll() {
  revalidatePath('/review');
  revalidatePath('/repository');
  revalidatePath('/dashboard');
}

/**
 * Everything currently awaiting Super Admin/CV Reviewer review — three independent maker-checker
 * gates (docs/04-rbac-security.md §10): a new self-service profile pending its first publish, a
 * claim request pending link approval, and a proposed edit to an already-published profile.
 */
export async function listPendingItemsAction(): Promise<PendingItem[]> {
  await requireReviewer();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('profiles')
    .select(
      'id, full_name, email, status, pending_claim_user_id, pending_change, pending_change_submitted_at, created_at'
    )
    .or('status.eq.draft,pending_claim_user_id.not.is.null,pending_change.not.is.null');

  if (error) throw error;

  const items: PendingItem[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    if (row.status === 'draft') {
      items.push({
        profileId: row.id,
        name: row.full_name,
        email: row.email,
        type: 'new_profile',
        submittedAt: row.created_at,
      });
    }
    if (row.pending_claim_user_id) {
      items.push({
        profileId: row.id,
        name: row.full_name,
        email: row.email,
        type: 'claim',
        submittedAt: row.created_at,
      });
    }
    if (row.pending_change) {
      items.push({
        profileId: row.id,
        name: row.full_name,
        email: row.email,
        type: 'change',
        submittedAt: row.pending_change_submitted_at ?? row.created_at,
        proposedChange: row.pending_change as CreateEmployeeInput,
      });
    }
  }

  return items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

/** Publishes a self-service "created from scratch" profile (0018), making it searchable. */
export async function approveNewProfileAction(profileId: string): Promise<void> {
  await requireReviewer();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .eq('status', 'draft');
  if (error) throw error;
  revalidateAll();
}

/** Rejects a never-published self-service submission — nothing to revert to, so it's deleted. */
export async function rejectNewProfileAction(profileId: string): Promise<void> {
  await requireReviewer();
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('profiles').delete().eq('id', profileId).eq('status', 'draft');
  if (error) throw error;
  revalidateAll();
}

/** Links the requesting employee's account to the profile (0020 profiles_self_claim_request). */
export async function approveClaimAction(profileId: string): Promise<void> {
  await requireReviewer();
  const adminClient = createAdminClient();

  const { data: row, error: fetchError } = await adminClient
    .from('profiles')
    .select('pending_claim_user_id')
    .eq('id', profileId)
    .single();
  if (fetchError) throw fetchError;
  if (!row.pending_claim_user_id) throw new Error('No pending claim on this profile.');

  const { error } = await adminClient
    .from('profiles')
    .update({
      user_id: row.pending_claim_user_id,
      pending_claim_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .is('user_id', null);
  if (error) throw error;
  revalidateAll();
}

export async function rejectClaimAction(profileId: string): Promise<void> {
  await requireReviewer();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ pending_claim_user_id: null })
    .eq('id', profileId);
  if (error) throw error;
  revalidateAll();
}

/**
 * Merges a proposed edit into the live profile. pending_change is a complete CreateEmployeeInput
 * (proposeProfileChangeAction fills in the immutable name/email server-side, see
 * app/(authenticated)/my-profile/actions.ts) — updateEmployee() does a full replace of
 * experiences/projects/certifications/skills, which is correct here because the self-edit form
 * always submits the complete current+edited state, never a partial patch.
 */
export async function approveChangeAction(profileId: string): Promise<void> {
  const user = await requireReviewer();
  const adminClient = createAdminClient();

  const { data: row, error: fetchError } = await adminClient
    .from('profiles')
    .select('pending_change')
    .eq('id', profileId)
    .single();
  if (fetchError) throw fetchError;
  const change = row.pending_change as CreateEmployeeInput | null;
  if (!change) throw new Error('No pending change on this profile.');

  await updateEmployee(adminClient, profileId, change, user.id);

  const { error } = await adminClient
    .from('profiles')
    .update({ pending_change: null, pending_change_submitted_at: null })
    .eq('id', profileId);
  if (error) throw error;
  revalidateAll();
}

export async function rejectChangeAction(profileId: string): Promise<void> {
  await requireReviewer();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ pending_change: null, pending_change_submitted_at: null })
    .eq('id', profileId);
  if (error) throw error;
  revalidateAll();
}
