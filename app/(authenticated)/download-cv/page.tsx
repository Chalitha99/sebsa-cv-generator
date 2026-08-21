import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getEmployeeById } from '@/services/employee-service';
import DownloadCvClient from './DownloadCvClient';

export default async function DownloadCvPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'employee') redirect('/dashboard');
  if (!user.hasLinkedProfile || !user.profileId) redirect('/onboarding');

  const supabase = await createClient();
  const employee = await getEmployeeById(supabase, user.profileId);
  if (!employee) redirect('/onboarding');

  // Still awaiting first publish — nothing of theirs is live yet to download.
  if (employee.status !== 'published') redirect(`/repository/${user.profileId}`);

  return <DownloadCvClient employee={employee} />;
}
