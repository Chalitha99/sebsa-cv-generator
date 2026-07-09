import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEmployeeByCode } from '@/services/employee-service';
import EmployeeProfileClient from './EmployeeProfileClient';

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const employee = await getEmployeeByCode(supabase, id.toUpperCase());

  if (!employee) notFound();

  return <EmployeeProfileClient employee={employee} />;
}
