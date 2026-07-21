import type { SupabaseClient } from '@supabase/supabase-js';

export interface GeneratedCvRow {
  id: string;
  profile_id: string;
  opportunity_id: string | null;
  template_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'exported';
  content: Record<string, any>;
  ai_highlights: Record<string, any>;
  ai_provider: string | null;
  ai_model: string | null;
  version: number;
  parent_generated_cv_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLatestGeneratedCvRow(
  supabase: SupabaseClient,
  profileId: string,
  templateId: string
): Promise<GeneratedCvRow | null> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .select('*')
    .eq('profile_id', profileId)
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as GeneratedCvRow | null;
}

export async function insertGeneratedCvRow(
  supabase: SupabaseClient,
  row: Omit<GeneratedCvRow, 'id' | 'created_at' | 'updated_at' | 'version'>
): Promise<GeneratedCvRow> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .insert({
      ...row,
      version: 1,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as GeneratedCvRow;
}

export async function updateGeneratedCvRow(
  supabase: SupabaseClient,
  id: string,
  content: Record<string, any>,
  updatedBy: string
): Promise<GeneratedCvRow> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .update({
      content,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as GeneratedCvRow;
}
