import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import { getCurrentUser } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Dashboard's quick actions (Upload CV, Generate Customer CV, Manage Templates) aren't
  // relevant to Employee (own profile only) or CV Reviewer (no create/generate permissions) —
  // docs/04-rbac-security.md §2. Send them to the page that actually matches their role.
  if (user.role === 'employee') redirect(`/repository/${user.employeeCode}`);
  if (user.role === 'cv_reviewer') redirect('/repository');

  const supabase = await createClient();
  const [employees, countResult] = await Promise.all([
    listEmployees(supabase),
    supabase.from('generated_cvs').select('*', { count: 'exact', head: true }),
  ]);
  const generatedCvCount = countResult.count ?? 0;

  return <DashboardClient employees={employees} generatedCvCount={generatedCvCount} />;
}
