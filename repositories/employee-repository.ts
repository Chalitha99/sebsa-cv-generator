import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateEmployeeInput } from '@/types/domain';

/**
 * Server-only. Raw Supabase queries for the `profiles` aggregate (profiles + experiences +
 * projects + certifications + skills + departments). Callers (services/employee-service.ts) map
 * these rows into the UI-facing `Employee` shape.
 *
 * Row shapes are `any` because `types/database.ts` is still the Phase-1 placeholder — swap to
 * `Database['public']['Tables']['profiles']['Row']` etc. once real types are generated (Phase 2).
 */

const LIST_SELECT = `
  id, employee_code, full_name, email, role_title, specialty, location, years_experience,
  avatar_url, updated_at,
  departments ( name ),
  profile_skills ( skills ( name ) )
`;

const DETAIL_SELECT = `
  ${LIST_SELECT},
  education,
  experiences ( company, role_title, employment_type, start_date, end_date, is_current, description, display_order ),
  projects ( name, description, tags, display_order ),
  certifications ( name, issuer, issued_date )
`;

export async function listEmployeeRows(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('profiles')
    .select(LIST_SELECT)
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getEmployeeRowByCode(supabase: SupabaseClient, employeeCode: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(DETAIL_SELECT)
    .eq('employee_code', employeeCode)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function generateEmployeeCode(): string {
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `EMP-${suffix}`;
}

const UNIQUE_VIOLATION = '23505';

export async function createEmployeeRow(
  supabase: SupabaseClient,
  input: CreateEmployeeInput,
  createdBy: string
): Promise<string> {
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', input.department)
    .maybeSingle();

  let profileId: string | null = null;
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5 && !profileId; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        employee_code: generateEmployeeCode(),
        full_name: input.name,
        email: input.email,
        role_title: input.role,
        department_id: dept?.id ?? null,
        status: 'published',
        created_by: createdBy,
        updated_by: createdBy,
      })
      .select('id')
      .single();

    if (!error) {
      profileId = data.id as string;
      break;
    }

    lastError = error;
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }

  if (!profileId) {
    throw new Error(lastError?.message ?? 'Failed to generate a unique employee code.');
  }

  if (input.skills.length > 0) {
    await linkSkills(supabase, profileId, input.skills);
  }

  return profileId;
}

async function linkSkills(supabase: SupabaseClient, profileId: string, skillNames: string[]) {
  const { data: existing, error: fetchError } = await supabase
    .from('skills')
    .select('id, name')
    .in('name', skillNames);
  if (fetchError) throw fetchError;

  const existingByName = new Map((existing ?? []).map((s: { id: string; name: string }) => [s.name, s.id]));
  const missingNames = skillNames.filter((name) => !existingByName.has(name));

  if (missingNames.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('skills')
      .insert(missingNames.map((name) => ({ name })))
      .select('id, name');
    if (insertError) throw insertError;
    (inserted ?? []).forEach((s: { id: string; name: string }) => existingByName.set(s.name, s.id));
  }

  const skillIds = skillNames.map((name) => existingByName.get(name)).filter((id): id is string => Boolean(id));

  const { error: linkError } = await supabase
    .from('profile_skills')
    .insert(skillIds.map((skill_id) => ({ profile_id: profileId, skill_id })));
  if (linkError) throw linkError;
}

export async function deleteEmployeeRow(supabase: SupabaseClient, rowId: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', rowId);
  if (error) throw error;
}
