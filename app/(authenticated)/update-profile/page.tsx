import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import { getDepartmentsAction } from '../upload/actions';
import { getCurrentUser, isAdminOrAbove } from '@/lib/auth';
import UpdateProfileClient from './UpdateProfileClient';

export default async function UpdateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Editing any employee's profile is Admin/Super Admin only (docs/04-rbac-security.md §2) —
  // matches the role check already enforced inside update-profile/actions.ts.
  if (user.role === 'employee') redirect(`/repository/${user.employeeCode}`);
  if (!isAdminOrAbove(user.role)) redirect('/repository');

  const supabase = await createClient();
  const employees = await listEmployees(supabase);
  const departments = await getDepartmentsAction();
  const { code } = await searchParams;

  // Arriving from the pencil icon on an employee's own profile page (EmployeeProfileClient.tsx)
  // pre-selects them instead of making the Admin re-pick from the dropdown.
  return <UpdateProfileClient initialEmployees={employees} departments={departments} initialCode={code} />;
}
