import ImageModule from 'docxtemplater-image-module-free';
import type { TailoredCv } from '@/app/(authenticated)/generate/types';

/**
 * Maps TailoredCv (the single source of truth — app/(authenticated)/generate/types.ts) onto the
 * field names an uploaded master DOCX template's placeholders might use. Deliberately
 * alias-heavy: covers a few common naming conventions a template author might reasonably pick
 * (fullName vs. name, jobTitle vs. currentPosition vs. title, etc.) rather than forcing one
 * exact vocabulary.
 *
 * Was previously duplicated (with drift) across three routes — see docs/04-rbac-security.md
 * history. This is the one shared copy; both /api/templates/generate and
 * /api/templates/generate-preview must use it so a template that renders in one renders
 * identically in the other.
 *
 * Placeholder delimiters are `{{ }}` (matches app/(authenticated)/templates/page.tsx's on-screen
 * guidance to admins) — callers must pass `delimiters: { start: '{{', end: '}}' }` to
 * Docxtemplater, since the library defaults to single-brace `{ }`.
 */
export function mapCvToTemplateData(cv: TailoredCv, imageBuffer?: Buffer) {
  return {
    fullName: cv.name || '',
    name: cv.name || '',
    jobTitle: cv.currentPosition || '',
    currentPosition: cv.currentPosition || '',
    title: cv.currentPosition || '',
    objective: cv.summary || '',
    summary: cv.summary || '',
    skills: Array.isArray(cv.skillsAligned) ? cv.skillsAligned.map((s) => ({ name: s })) : [],
    skillsAligned: Array.isArray(cv.skillsAligned) ? cv.skillsAligned.map((s) => ({ name: s })) : [],
    experience: Array.isArray(cv.experience)
      ? cv.experience.map((e) => ({
          position: e.position || '',
          company: e.company || '',
          period: e.period || '',
          description: Array.isArray(e.tasks) ? e.tasks.map((t) => `• ${t}`).join('\n') : '',
          tasks: Array.isArray(e.tasks) ? e.tasks.map((t) => ({ task: t })) : [],
          tasksList: Array.isArray(e.tasks) ? e.tasks.map((t) => `• ${t}`).join('\n') : '',
        }))
      : [],
    education: Array.isArray(cv.academic)
      ? cv.academic.map((a) => ({
          degree: a.qualification || '',
          qualification: a.qualification || '',
          institution: a.institution || '',
          year: a.period || '',
          period: a.period || '',
        }))
      : [],
    academic: Array.isArray(cv.academic)
      ? cv.academic.map((a) => ({
          degree: a.qualification || '',
          qualification: a.qualification || '',
          institution: a.institution || '',
          year: a.period || '',
          period: a.period || '',
        }))
      : [],
    projects: Array.isArray(cv.specialProjects)
      ? cv.specialProjects.map((p) => ({
          projectName: p.title || '',
          title: p.title || '',
          projectDescription: p.brief || '',
          brief: p.brief || '',
        }))
      : [],
    specialProjects: Array.isArray(cv.specialProjects)
      ? cv.specialProjects.map((p) => ({
          projectName: p.title || '',
          title: p.title || '',
          projectDescription: p.brief || '',
          brief: p.brief || '',
        }))
      : [],
    certifications: Array.isArray(cv.certifications)
      ? cv.certifications.map((c) => ({
          certificateName: c.name || '',
          name: c.name || '',
          issuer: c.issuer || '',
          year: c.year || '',
        }))
      : [],
    ...(imageBuffer ? { profileImage: imageBuffer } : {}),
  };
}

/** Fetches an image URL and returns it as a Buffer, or null if unavailable/not an image. */
export async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

/**
 * Shared image module config for docxtemplater-image-module-free. `setParser` recognizes the
 * bare tag name `profileImage` (not the module's usual `%`-prefixed convention) — matches the
 * reference SEBSA template's plain `{{profileImage}}` placeholder.
 */
export function createImageModule(imageBuffer: Buffer) {
  return new ImageModule({
    centered: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setParser(placeHolderContent: string): any {
      if (placeHolderContent === 'profileImage') {
        return {
          type: 'placeholder',
          value: 'profileImage',
          module: 'open-xml-templating/docxtemplater-image-module',
          centered: false,
        };
      }
      return null;
    },
    getImage() {
      return imageBuffer;
    },
    getSize() {
      // EMUs (914400 EMU = 1 inch). 1.2in x 1.2in.
      return [914400 * 1.2, 914400 * 1.2];
    },
  });
}
