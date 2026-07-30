import type { SupabaseClient } from '@supabase/supabase-js';

export interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  branding: Record<string, any>;
  layout_config: Record<string, any> & { storage_path?: string };
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listTemplateRows(supabase: SupabaseClient): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TemplateRow[];
}

export async function getTemplateRowById(supabase: SupabaseClient, id: string): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as TemplateRow | null;
}

export async function createTemplateRow(
  supabase: SupabaseClient,
  name: string,
  description: string,
  storagePath: string,
  createdBy: string
): Promise<string> {
  const { data, error } = await supabase
    .from('templates')
    .insert({
      name,
      description: description || null,
      layout_config: { storage_path: storagePath },
      created_by: createdBy,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function deleteTemplateRow(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
