import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEmployeeById } from '@/services/employee-service';
import { getCurrentUser } from '@/lib/auth';
import EmployeeProfileClient from './EmployeeProfileClient';

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const supabase = await createClient();
  const employee = await getEmployeeById(supabase, id);

  // RLS already scopes this: an Employee requesting an id that isn't their own gets no row back
  // (profiles_select only allows is_reviewer_or_above() or user_id = auth.uid()), so this also
  // naturally 404s for "someone else's profile" without a separate ownership check here.
  if (!employee) notFound();
  return <EmployeeProfileClient employee={employee} viewerRole={user.role} />;
}
