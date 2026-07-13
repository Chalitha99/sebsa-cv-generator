/**
 * Shared TypeScript interfaces for the structured CV parsing pipeline.
 * Used by the Gemini API route (server), the upload page form (client),
 * and the DataContext addEmployee flow.
 */

export interface CvExperienceEntry {
  position: string;
  company: string;
  period: string;
  tasks: string[];
}

export interface CvAcademicEntry {
  qualification: string;
  institution: string;
  period: string;
}

export interface CvProjectEntry {
  title: string;
  brief: string;
}

export interface CvCertificationEntry {
  name: string;
  issuer: string;
  year: string;
}

export interface CvProfile {
  name: string;
  currentPosition: string;
  experience: CvExperienceEntry[];
  academic: CvAcademicEntry[];
  specialProjects: CvProjectEntry[];
  certifications: CvCertificationEntry[];
}

/** Returns a blank CvProfile — used to seed the edit form before parsing. */
export function emptyCvProfile(): CvProfile {
  return {
    name: '',
    currentPosition: '',
    experience: [],
    academic: [],
    specialProjects: [],
    certifications: [],
  };
}
