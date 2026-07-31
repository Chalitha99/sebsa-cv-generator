import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplateById } from '@/services/template-service';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { randomUUID } from 'crypto';

/**
 * Maps a tailored CV object to the flat/nested data structure expected by
 * docxtemplater placeholders in the DOCX template.
 */
function mapCvToTemplateData(cv: any, imageBuffer?: Buffer) {
  return {
    fullName: cv.name || '',
    name: cv.name || '',
    jobTitle: cv.currentPosition || '',
    currentPosition: cv.currentPosition || '',
    title: cv.currentPosition || '',
    objective: cv.summary || '',
    summary: cv.summary || '',
    skills: Array.isArray(cv.skillsAligned)
      ? cv.skillsAligned.map((s: string) => ({ name: s }))
      : [],
    skillsAligned: Array.isArray(cv.skillsAligned)
      ? cv.skillsAligned.map((s: string) => ({ name: s }))
      : [],
    experience: Array.isArray(cv.experience)
      ? cv.experience.map((e: any) => ({
          position: e.position || '',
          company: e.company || '',
          period: e.period || '',
          description: Array.isArray(e.tasks)
            ? e.tasks.map((t: string) => `• ${t}`).join('\n')
            : (e.description || ''),
          tasks: Array.isArray(e.tasks) ? e.tasks.map((t: string) => ({ task: t })) : [],
          tasksList: Array.isArray(e.tasks)
            ? e.tasks.map((t: string) => `• ${t}`).join('\n')
            : '',
        }))
      : [],
    education: Array.isArray(cv.academic)
      ? cv.academic.map((a: any) => ({
          degree: a.qualification || '',
          qualification: a.qualification || '',
          institution: a.institution || '',
          year: a.period || '',
          period: a.period || '',
        }))
      : [],
    academic: Array.isArray(cv.academic)
      ? cv.academic.map((a: any) => ({
          degree: a.qualification || '',
          qualification: a.qualification || '',
          institution: a.institution || '',
          year: a.period || '',
          period: a.period || '',
        }))
      : [],
    projects: Array.isArray(cv.specialProjects)
      ? cv.specialProjects.map((p: any) => ({
          projectName: p.title || '',
          title: p.title || '',
          projectDescription: p.brief || '',
          brief: p.brief || '',
        }))
      : [],
    specialProjects: Array.isArray(cv.specialProjects)
      ? cv.specialProjects.map((p: any) => ({
          projectName: p.title || '',
          title: p.title || '',
          projectDescription: p.brief || '',
          brief: p.brief || '',
        }))
      : [],
    certifications: Array.isArray(cv.certifications)
      ? cv.certifications.map((c: any) => ({
          certificateName: c.name || '',
          name: c.name || '',
          issuer: c.issuer || '',
          year: c.year || '',
        }))
      : [],
    ...(imageBuffer ? { profileImage: imageBuffer } : {}),
  };
}

/**
 * Fetches an image from a public URL and returns it as a Buffer.
 * Returns null if the URL is unreachable, times out, or is not an image.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
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
 * POST /api/templates/generate-preview
 *
 * Body: { templateId: string, tailoredCv: object, avatarUrl?: string }
 *
 * 1. Downloads the original DOCX template from Supabase Storage.
 * 2. Fills all placeholders with tailoredCv data (same logic as /api/templates/generate).
 * 3. Uploads the filled DOCX to cv-templates/previews/<uuid>.docx (temporary path).
 * 4. Creates a 10-minute signed URL for the uploaded preview file.
 * 5. Returns { signedUrl, previewPath } so the client can embed it in an iframe
 *    via Microsoft Office Online Viewer.
 *
 * The previewPath is ephemeral — files accumulate in the previews/ prefix and
 * can be purged periodically via a scheduled cleanup job.
 */
export async function POST(request: Request) {
  const adminClient = createAdminClient();

  try {
    const body = await request.json();
    const { templateId, tailoredCv, avatarUrl } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
    }
    if (!tailoredCv) {
      return NextResponse.json({ error: 'Missing tailoredCv' }, { status: 400 });
    }

    // ── 1. Resolve template metadata ─────────────────────────────────────────
    const template = await getTemplateById(adminClient, templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (!template.storagePath) {
      return NextResponse.json(
        { error: 'Template has no associated storage file' },
        { status: 400 }
      );
    }

    // ── 2. Download original DOCX from Supabase Storage ──────────────────────
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('cv-templates')
      .download(template.storagePath);

    if (downloadError || !fileData) {
      console.error('generate-preview: download error', downloadError);
      return NextResponse.json(
        { error: 'Failed to download the template file from storage' },
        { status: 500 }
      );
    }

    const templateBuffer = Buffer.from(await fileData.arrayBuffer());

    // ── 3. Optionally fetch the profile avatar image ──────────────────────────
    let imageBuffer: Buffer | null = null;
    if (avatarUrl && typeof avatarUrl === 'string') {
      imageBuffer = await fetchImageBuffer(avatarUrl);
    }

    // ── 4. Fill template placeholders via docxtemplater ──────────────────────
    const zip = new PizZip(templateBuffer);

    const modules: any[] = [];
    if (imageBuffer) {
      const imgBuf = imageBuffer;
      const imageModule = new ImageModule({
        centered: false,
        setParser(placeHolderContent: string) {
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
          return imgBuf;
        },
        getSize() {
          // 1.2 in × 1.2 in expressed in EMUs (914 400 EMU = 1 inch)
          return [914400 * 1.2, 914400 * 1.2];
        },
      });
      modules.push(imageModule);
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules,
    });

    const mappedData = mapCvToTemplateData(tailoredCv, imageBuffer ?? undefined);
    doc.render(mappedData);

    const filledBuffer: Buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // ── 5. Upload filled DOCX to a temporary previews/ path ──────────────────
    const previewPath = `previews/${randomUUID()}.docx`;

    const { error: uploadError } = await adminClient.storage
      .from('cv-templates')
      .upload(previewPath, filledBuffer, {
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('generate-preview: upload error', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload the generated preview file' },
        { status: 500 }
      );
    }

    // ── 6. Create a 10-minute signed URL for Office Online Viewer ────────────
    const { data: signedData, error: signedError } = await adminClient.storage
      .from('cv-templates')
      .createSignedUrl(previewPath, 600); // 600 s = 10 min

    if (signedError || !signedData?.signedUrl) {
      console.error('generate-preview: signed-url error', signedError);
      // Clean up the orphaned upload before returning the error
      await adminClient.storage.from('cv-templates').remove([previewPath]);
      return NextResponse.json(
        { error: 'Failed to generate a signed URL for the preview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      previewPath, // Returned for optional client-side or scheduled cleanup
    });
  } catch (error: any) {
    console.error('generate-preview: unhandled error', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate the CV preview' },
      { status: 500 }
    );
  }
}
