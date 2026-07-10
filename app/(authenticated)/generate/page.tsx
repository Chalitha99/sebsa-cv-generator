import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import GenerateClient from './GenerateClient';

export default async function GeneratePage() {
  const supabase = await createClient();
  const employees = await listEmployees(supabase);

  return <GenerateClient employees={employees} />;
}
