import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getLatestGeneratedCvRow,
  insertGeneratedCvRow,
  updateGeneratedCvRow,
} from '@/repositories/generated-cv-repository';

export async function getSavedGeneratedCv(
  supabase: SupabaseClient,
  profileId: string
): Promise<Record<string, any> | null> {
  const row = await getLatestGeneratedCvRow(supabase, profileId);
  return row ? row.content : null;
}

export async function saveGeneratedCv(
  supabase: SupabaseClient,
  params: {
    profileId: string;
    content: Record<string, any>;
    userId: string;
  }
): Promise<Record<string, any>> {
  const existing = await getLatestGeneratedCvRow(supabase, params.profileId);

  if (existing) {
    const saved = await updateGeneratedCvRow(
      supabase,
      existing.id,
      params.content,
      params.userId
    );
    return saved.content;
  } else {
    const saved = await insertGeneratedCvRow(supabase, {
      profile_id: params.profileId,
      status: 'draft',
      content: params.content,
      ai_provider: 'gemini',
      ai_model: 'gemini-3-flash-preview',
      created_by: params.userId,
      updated_by: params.userId,
    });
    return saved.content;
  }
}
