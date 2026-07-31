import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplateById } from '@/services/template-service';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';

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
 * Fetches an image from a URL and returns it as a Buffer.
 * Returns null if the URL is invalid, inaccessible, or not an image.
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

export async function POST(request: Request) {
  try {
    const { templateId, tailoredCv, avatarUrl } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }
    if (!tailoredCv) {
      return NextResponse.json({ error: 'Missing CV data' }, { status: 400 });
    }

    // 1. Get the template record from database
    const adminClient = createAdminClient();
    const template = await getTemplateById(adminClient, templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.storagePath) {
      return NextResponse.json({ error: 'Template has no file path in storage' }, { status: 400 });
    }

    // 2. Download template file from Supabase Storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('cv-templates')
      .download(template.storagePath);

    if (downloadError || !fileData) {
      console.error('Error downloading template:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download template file from storage' },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const templateBuffer = Buffer.from(arrayBuffer);

    // 3. Optionally fetch the profile image
    let imageBuffer: Buffer | null = null;
    if (avatarUrl && typeof avatarUrl === 'string') {
      imageBuffer = await fetchImageBuffer(avatarUrl);
    }

    // 4. Build docxtemplater with optional image module
    const zip = new PizZip(templateBuffer);

    const modules: any[] = [];
    if (imageBuffer) {
      const imgBuf = imageBuffer; // capture for closure
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
        getImage(tagValue: any) {
          // For {{profileImage}}, tagValue will be the buffer we pass
          return imgBuf;
        },
        getSize() {
          // Return width x height in EMUs (English Metric Units).
          // 914400 EMU = 1 inch. We use 1.2 in × 1.2 in as default portrait size.
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

    const generatedBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 5. Return as downloadable docx response
    return new NextResponse(generatedBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(tailoredCv.name ?? 'CV').replace(/\s+/g, '_')}_Tailored_CV.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
