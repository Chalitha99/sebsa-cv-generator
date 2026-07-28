import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplateById } from '@/services/template-service';

/**
 * GET /api/templates/raw?templateId=<id>
 *
 * Returns the raw DOCX file from Supabase Storage as an octet-stream blob.
 * This is used by the client-side docx-preview renderer to display the
 * original template faithfully without any placeholder parsing.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId query parameter' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const template = await getTemplateById(adminClient, templateId);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.storagePath) {
      return NextResponse.json({ error: 'Template has no file path in storage' }, { status: 400 });
    }

    // Download the raw DOCX from Supabase Storage
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

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `inline; filename="${template.name ?? 'template'}.docx"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error serving raw template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve template file' },
      { status: 500 }
    );
  }
}
