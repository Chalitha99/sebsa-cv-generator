import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import RepositoryClient from './RepositoryClient';

export default async function RepositoryPage() {
  const supabase = await createClient();
  const employees = await listEmployees(supabase);

  return <RepositoryClient employees={employees} />;
}
