import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ActivityLogClient from './ActivityLogClient';

export default async function ActivityLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Same audience as the Dashboard it's linked from (docs/04-rbac-security.md §2).
  if (user.role === 'employee') redirect(`/repository/${user.profileId}`);
  if (user.role === 'cv_reviewer') redirect('/repository');

  return <ActivityLogClient />;
}
