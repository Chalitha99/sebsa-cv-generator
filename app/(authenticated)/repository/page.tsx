import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import { getCurrentUser } from '@/lib/auth';
import RepositoryClient from './RepositoryClient';

export default async function RepositoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Employees only ever see their own profile — not the general repository (matrix: "View own"
  // only, docs/04-rbac-security.md §2). CV Reviewer/Admin/Super Admin all have "View all".
  if (user.role === 'employee') redirect(`/repository/${user.employeeCode}`);

  const supabase = await createClient();
  const employees = await listEmployees(supabase);

  return <RepositoryClient employees={employees} viewerRole={user.role} />;
}
