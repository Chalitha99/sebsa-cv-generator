import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplateById } from '@/services/template-service';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';

function mapCvToTemplateData(cv: any) {
  return {
    fullName: cv.name || '',
    name: cv.name || '',
    jobTitle: cv.currentPosition || '',
    currentPosition: cv.currentPosition || '',
    title: cv.currentPosition || '',
    objective: cv.summary || '',
    summary: cv.summary || '',
    skills: Array.isArray(cv.skillsAligned) ? cv.skillsAligned.join(', ') : '',
    skillsAligned: Array.isArray(cv.skillsAligned)
      ? cv.skillsAligned.map((s: string) => ({ name: s }))
      : [],
    experience: Array.isArray(cv.experience)
      ? cv.experience.map((e: any) => ({
          ...e,
          tasks: Array.isArray(e.tasks) ? e.tasks.map((t: string) => ({ task: t })) : [],
          tasksList: Array.isArray(e.tasks)
            ? e.tasks.map((t: string) => `• ${t}`).join('\n')
            : '',
        }))
      : [],
    education: Array.isArray(cv.academic) ? cv.academic : [],
    academic: Array.isArray(cv.academic) ? cv.academic : [],
    projects: Array.isArray(cv.specialProjects) ? cv.specialProjects : [],
    specialProjects: Array.isArray(cv.specialProjects) ? cv.specialProjects : [],
    certifications: Array.isArray(cv.certifications) ? cv.certifications : [],
    // For preview, profileImage renders as an empty string — the actual image is
    // injected into the HTML wrapper below using the public URL.
    profileImage: '',
  };
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

    // 3. Perform placeholder replacement using pizzip and docxtemplater
    //    Image placeholders are replaced with empty strings for preview purposes —
    //    the actual image is injected into the HTML below.
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const mappedData = mapCvToTemplateData(tailoredCv);
    doc.render(mappedData);

    const generatedBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 4. Convert generated DOCX buffer to HTML using Mammoth for preview
    const mammothResult = await mammoth.convertToHtml({ buffer: generatedBuffer });

    // 5. If a profile image URL is provided, inject it at the top of the preview HTML
    let previewHtml = mammothResult.value;
    if (avatarUrl && typeof avatarUrl === 'string') {
      const imageHtml = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e2e8f0;">
          <img
            src="${avatarUrl}"
            alt="Profile photo"
            style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #e0e7ff;box-shadow:0 2px 8px rgba(0,0,0,0.1);"
            crossorigin="anonymous"
          />
        </div>
      `;
      previewHtml = imageHtml + previewHtml;
    }

    return NextResponse.json({
      html: previewHtml,
      warnings: mammothResult.messages,
    });
  } catch (error: any) {
    console.error('Error rendering template preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to render template preview' },
      { status: 500 }
    );
  }
}
