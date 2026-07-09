import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createEmployeeRow,
  deleteEmployeeRow,
  getEmployeeRowByCode,
  listEmployeeRows,
} from '@/repositories/employee-repository';
import type { CreateEmployeeInput, Employee, EmployeeExperience, EmployeeProject } from '@/types/domain';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120';

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSkills(row: any): string[] {
  return ((row.profile_skills ?? []) as Array<{ skills: { name: string } | null }>)
    .map((ps) => ps.skills?.name)
    .filter((name): name is string => Boolean(name));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListRow(row: any): Employee {
  return {
    rowId: row.id,
    id: `#${row.employee_code}`,
    employeeCode: row.employee_code,
    name: row.full_name,
    email: row.email,
    role: row.role_title ?? '',
    specialty: row.specialty ?? undefined,
    location: row.location ?? undefined,
    experienceYears:
      row.years_experience != null ? `${row.years_experience}+ Years Experience` : undefined,
    department: row.departments?.name ?? 'Unassigned',
    skills: mapSkills(row),
    lastUpdated: formatDate(row.updated_at),
    avatar: row.avatar_url ?? DEFAULT_AVATAR,
  };
}

export async function listEmployees(supabase: SupabaseClient): Promise<Employee[]> {
  const rows = await listEmployeeRows(supabase);
  return rows.map(mapListRow);
}

export async function getEmployeeByCode(
  supabase: SupabaseClient,
  employeeCode: string
): Promise<Employee | null> {
  const row = await getEmployeeRowByCode(supabase, employeeCode);
  if (!row) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const experience: EmployeeExperience[] = ((row as any).experiences ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.display_order - b.display_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => ({
      role: e.role_title,
      company: e.company,
      type: e.employment_type ?? 'Full-time',
      period: `${formatDate(e.start_date) || 'N/A'} — ${
        e.is_current ? 'Present' : formatDate(e.end_date) || 'N/A'
      }`,
      desc: e.description ?? '',
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: EmployeeProject[] = ((row as any).projects ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.display_order - b.display_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({ name: p.name, desc: p.description ?? '', tags: p.tags ?? [] }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const certs: string[] = ((row as any).certifications ?? []).map((c: any) =>
    [c.name, c.issuer ? `(${c.issuer}${c.issued_date ? ` • ${new Date(c.issued_date).getFullYear()}` : ''})` : null]
      .filter(Boolean)
      .join(' ')
  );

  return {
    ...mapListRow(row),
    experience: experience.length > 0 ? experience : undefined,
    projects: projects.length > 0 ? projects : undefined,
    certs: certs.length > 0 ? certs : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    education: (row as any).education ?? undefined,
  };
}

export async function createEmployee(
  supabase: SupabaseClient,
  input: CreateEmployeeInput,
  createdBy: string
): Promise<string> {
  return createEmployeeRow(supabase, input, createdBy);
}

export async function deleteEmployee(supabase: SupabaseClient, rowId: string): Promise<void> {
  await deleteEmployeeRow(supabase, rowId);
}
