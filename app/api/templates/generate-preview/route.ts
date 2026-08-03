import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdminOrAbove } from '@/lib/auth';
import { getTemplateById } from '@/services/template-service';
import { mapCvToTemplateData, fetchImageBuffer, createImageModule } from '@/lib/templates/mapCvToTemplateData';

/**
 * POST /api/templates/generate-preview
 *
 * Body: { templateId: string, tailoredCv: object, avatarUrl?: string }
 *
 * 1. Downloads the original DOCX template from Supabase Storage.
 * 2. Fills all placeholders with tailoredCv data (mapCvToTemplateData — same as /api/templates/generate).
 * 3. Uploads the filled DOCX to cv-templates/previews/<uuid>.docx (temporary path).
 * 4. Creates a 10-minute signed URL for the uploaded preview file.
 * 5. Returns { signedUrl, previewPath } so the client can embed it in an iframe
 *    via Microsoft Office Online Viewer (GeneratedCvPreview.tsx).
 *
 * The previewPath is ephemeral — files accumulate in the previews/ prefix and
 * can be purged periodically via a scheduled cleanup job (not implemented yet).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!isAdminOrAbove(user.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin or Super Admin role required.' }, { status: 403 });
  }

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
    const modules = imageBuffer ? [createImageModule(imageBuffer)] : [];

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      modules,
      // See app/api/templates/generate/route.ts for why this is needed.
      nullGetter: () => '',
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
  } catch (error) {
    console.error('generate-preview: unhandled error', error);
    const message = error instanceof Error ? error.message : 'Failed to generate the CV preview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
