import { createClient } from '@/lib/supabase/server';
import { listEmployees } from '@/services/employee-service';
import { getDepartmentsAction } from '../upload/actions';
import UpdateProfileClient from './UpdateProfileClient';

export default async function UpdateProfilePage() {
  const supabase = await createClient();
  const employees = await listEmployees(supabase);
  const departments = await getDepartmentsAction();

  return <UpdateProfileClient initialEmployees={employees} departments={departments} />;
}
