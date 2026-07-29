import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTemplateById } from '@/services/template-service';

/**
 * GET /api/templates/signed-url?templateId=<id>
 *
 * Generates a signed URL for a DOCX template stored in the private Supabase
 * Storage bucket `cv-templates`. The URL has a 10-minute expiry time,
 * allowing Microsoft Office Online Viewer to fetch it without authentication headers.
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

    // Generate a signed URL for 10 minutes (600 seconds)
    const { data, error: signedUrlError } = await adminClient.storage
      .from('cv-templates')
      .createSignedUrl(template.storagePath, 600);

    if (signedUrlError || !data?.signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate signed URL for document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    console.error('Error serving signed URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve signed URL' },
      { status: 500 }
    );
  }
}
