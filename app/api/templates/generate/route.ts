import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { getTemplateById } from '@/services/template-service';
import { mapCvToTemplateData, fetchImageBuffer, createImageModule } from '@/lib/templates/mapCvToTemplateData';

export async function POST(request: Request) {
  try {
    // This is a stateless render service, not a data-access endpoint — the caller already has
    // `tailoredCv` in hand (either from the Admin/Super Admin "Customize CVs" wizard, or an
    // Employee rendering their own already-RLS-scoped profile at /repository/[id] — see
    // docs/04-rbac-security.md §15), so any authenticated user may call it. Just require a session.
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

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

    // 4. Build docxtemplater with optional image module. Delimiters MUST be explicit — the
    //    library defaults to single-brace `{ }`, but the admin upload UI (and the reference
    //    SEBSA template) use double-brace `{{ }}` placeholders.
    const zip = new PizZip(templateBuffer);

    const modules = imageBuffer ? [createImageModule(imageBuffer)] : [];

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      modules,
      // Without this, a tag with no value (e.g. {{profileImage}} when the employee has no
      // avatar) renders the literal text "undefined" instead of nothing — confirmed via a
      // render test against the real reference template.
      nullGetter: () => '',
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
  } catch (error) {
    console.error('Error generating DOCX:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate DOCX';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
