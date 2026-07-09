import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const employees = await listEmployees(supabase);

  return <DashboardClient employees={employees} />;
}
