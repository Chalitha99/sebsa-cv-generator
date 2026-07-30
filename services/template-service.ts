import type { SupabaseClient } from '@supabase/supabase-js';
import {
  listTemplateRows,
  getTemplateRowById,
  createTemplateRow,
  deleteTemplateRow,
  type TemplateRow,
} from '@/repositories/template-repository';

export interface Template {
  id: string;
  name: string;
  description: string;
  storagePath: string;
  createdAt: string;
}

function mapRowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    storagePath: row.layout_config?.storage_path ?? '',
    createdAt: row.created_at,
  };
}

export async function listTemplates(supabase: SupabaseClient): Promise<Template[]> {
  const rows = await listTemplateRows(supabase);
  return rows.map(mapRowToTemplate);
}

export async function uploadTemplate(
  supabase: SupabaseClient,
  name: string,
  description: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  createdBy: string
): Promise<string> {
  const uniqueName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
  const storagePath = `templates/${uniqueName}`;

  // 1. Upload file to Supabase storage bucket `cv-templates`
  const { error: uploadError } = await supabase.storage
    .from('cv-templates')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      duplex: 'half',
    });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    throw new Error(`Failed to upload template file to storage: ${uploadError.message}`);
  }

  try {
    // 2. Save metadata in DB templates table
    const templateId = await createTemplateRow(
      supabase,
      name,
      description,
      storagePath,
      createdBy
    );
    return templateId;
  } catch (dbError) {
    // Cleanup storage if database insert fails
    await supabase.storage.from('cv-templates').remove([storagePath]);
    throw dbError;
  }
}

export async function getTemplateById(supabase: SupabaseClient, id: string): Promise<Template | null> {
  const row = await getTemplateRowById(supabase, id);
  if (!row) return null;
  return mapRowToTemplate(row);
}

export async function deleteTemplate(supabase: SupabaseClient, id: string): Promise<void> {
  const row = await getTemplateRowById(supabase, id);
  if (!row) return;

  const storagePath = row.layout_config?.storage_path;
  if (storagePath) {
    // 1. Remove file from storage
    const { error: removeError } = await supabase.storage
      .from('cv-templates')
      .remove([storagePath]);
    if (removeError) {
      console.warn(`Failed to remove file from storage: ${removeError.message}`);
    }
  }

  // 2. Delete database entry
  await deleteTemplateRow(supabase, id);
}
