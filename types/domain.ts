/**
 * UI-facing employee shape. Deliberately mirrors the original DataContext `Employee` type so the
 * existing pages/JSX don't need restructuring — only their data source changes. `id` stays the
 * "#EMP-00124" display form used throughout the UI; `employeeCode` (no "#") is what routes/lookups
 * use. Real row identity (the profiles.id uuid) is a separate `rowId`, used only for mutations.
 */
export interface EmployeeExperience {
  role: string;
  company: string;
  type: string;
  period: string;
  desc: string;
}

export interface EmployeeProject {
  name: string;
  desc: string;
  tags: string[];
}

export interface Employee {
  rowId: string;
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  location?: string;
  experienceYears?: string;
  department: string;
  skills: string[];
  lastUpdated: string;
  avatar: string;
  experience?: EmployeeExperience[];
  projects?: EmployeeProject[];
  certs?: string[];
  education?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
}
