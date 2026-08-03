import type { Employee } from '@/types/domain';
import type { TailoredCv } from '@/app/(authenticated)/generate/types';

/**
 * Converts an already-loaded (RLS-scoped) `Employee` straight into the `TailoredCv` shape that
 * `CvPreviewTemplate`/`lib/cvExport.ts` render and export, with no AI tailoring step — used for
 * the "preview & download my own CV" feature (repository/[id]) rather than the Admin/Super Admin
 * "Customize CVs" wizard (app/(authenticated)/generate/), which produces a `TailoredCv` via
 * Gemini instead. `summary` and `customerName` are left blank on purpose — the Handlebars
 * template (`lib/templates/cvTemplate.ts`) simply omits those sections/lines when empty.
 *
 * Prefers the structured Gemini-parsed fields (cvExperience/cvAcademic/specialProjects/
 * cvCertifications); falls back to the legacy demo-data shapes for the handful of
 * pre-seeded/older profiles that never went through the parsing pipeline.
 */
export function buildTailoredCvFromEmployee(employee: Employee): TailoredCv {
  const experience =
    employee.cvExperience && employee.cvExperience.length > 0
      ? employee.cvExperience
      : (employee.experience ?? []).map((exp) => ({
          position: exp.role,
          company: exp.company,
          period: exp.period,
          tasks: exp.desc ? [exp.desc] : [],
        }));

  const specialProjects =
    employee.specialProjects && employee.specialProjects.length > 0
      ? employee.specialProjects
      : (employee.projects ?? []).map((proj) => ({
          title: proj.name,
          brief: proj.desc,
        }));

  const certifications =
    employee.cvCertifications && employee.cvCertifications.length > 0
      ? employee.cvCertifications
      : (employee.certs ?? []).map((cert) => ({ name: cert, issuer: '', year: '' }));

  // No legacy equivalent for structured academic entries — `employee.education` is a single
  // free-text string, not a list, so there's nothing sensible to fall back to.
  const academic = employee.cvAcademic ?? [];

  return {
    name: employee.name,
    currentPosition: employee.currentPosition || employee.role,
    summary: '',
    customerName: '',
    skillsAligned: employee.skills,
    experience,
    academic,
    specialProjects,
    certifications,
    avatar: employee.avatar,
  };
}
