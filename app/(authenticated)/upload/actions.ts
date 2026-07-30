'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmployee } from '@/services/employee-service';
import type { CreateEmployeeInput } from '@/types/domain';

/**
 * Uploads a profile picture to the `profile-pictures` Supabase Storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadProfilePictureAction(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No image file provided.');

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uniqueName = `avatars/${Date.now()}_${user.id}.${ext}`;

  const adminClient = createAdminClient();

  const { error: uploadError } = await adminClient.storage
    .from('profile-pictures')
    .upload(uniqueName, await file.arrayBuffer(), {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
  }

  const { data: urlData } = adminClient.storage
    .from('profile-pictures')
    .getPublicUrl(uniqueName);

  return urlData.publicUrl;
}

/**
 * Creates a new employee profile.
 *
 * Uses the service-role (admin) Supabase client for all write operations so that
 * Row Level Security policies on `profiles`, `experiences`, `projects`, `certifications`,
 * `skills`, and `profile_skills` are bypassed. The anon/user client is only used to
 * verify the caller is authenticated before we proceed — we still require a valid session.
 */
export async function createEmployeeAction(input: CreateEmployeeInput): Promise<string> {
  // 1. Verify the caller has a valid authenticated session (user-scoped client, RLS enforced).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  // 2. Perform all DB writes using the service-role client that bypasses RLS.
  //    The service-role key is server-only and never sent to the browser.
  const adminClient = createAdminClient();
  const rowId = await createEmployee(adminClient, input, user.id);

  revalidatePath('/repository');
  revalidatePath('/dashboard');
  return rowId;
}

/**
 * Fetches the list of department names from the `departments` table.
 * Used to populate the department dropdown on the upload page.
 * Uses the user-scoped client — the `departments_select` RLS policy allows any
 * authenticated user to read departments.
 */
export async function getDepartmentsAction(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch departments:', error.message);
    return [];
  }

  return (data ?? []) as { id: string; name: string }[];
}
