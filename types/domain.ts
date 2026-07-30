import type {
  CvExperienceEntry,
  CvAcademicEntry,
  CvProjectEntry,
  CvCertificationEntry,
} from '@/lib/cvTypes';

/**
 * UI-facing employee shape. Deliberately mirrors the original DataContext `Employee` type so the
 * existing pages/JSX don't need restructuring — only their data source changes. `id` stays the
 * "#EMP-00124" display form used throughout the UI; `employeeCode` (no "#") is what routes/lookups
 * use. Real row identity (the profiles.id uuid) is a separate `rowId`, used only for mutations.
 *
 * Structured CV fields (experience, academic, specialProjects, certifications) are added to
 * support the Gemini parsing pipeline introduced in Phase 5.
 */

// Legacy experience shape — still used by getEmployeeByCode for database-fetched profiles
export interface EmployeeExperience {
  role: string;
  company: string;
  type: string;
  period: string;
  desc: string;
}

// Legacy project shape — still used by getEmployeeByCode for database-fetched profiles
export interface EmployeeProject {
  name: string;
  desc: string;
  tags: string[];
}

// Re-export CV types for convenience in service / repository layers
export type { CvExperienceEntry, CvAcademicEntry, CvProjectEntry, CvCertificationEntry };

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

  // Legacy optional fields (populated from Supabase for existing employees)
  experience?: EmployeeExperience[];
  projects?: EmployeeProject[];
  certs?: string[];
  education?: string;

  // Structured CV fields (populated from Gemini-parsed CVs)
  cvExperience?: CvExperienceEntry[];
  cvAcademic?: CvAcademicEntry[];
  specialProjects?: CvProjectEntry[];
  cvCertifications?: CvCertificationEntry[];
  currentPosition?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];

  // Optional structured CV fields — populated from Gemini parsing pipeline
  currentPosition?: string;
  cvExperience?: CvExperienceEntry[];
  cvAcademic?: CvAcademicEntry[];
  specialProjects?: CvProjectEntry[];
  cvCertifications?: CvCertificationEntry[];

  // Profile picture URL — stored in Supabase Storage profile-pictures bucket
  avatarUrl?: string;
}
