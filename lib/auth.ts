import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'employee';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120';

/**
 * Server-only. Resolves the signed-in user's session + RBAC role + (if linked) profile display
 * fields. Returns null when there's no session — callers decide whether that means "redirect to
 * /login" (middleware already does this for protected routes) or "render a logged-out state".
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? '',
    role: (roleRow?.role as UserRole | undefined) ?? 'employee',
    fullName: profileRow?.full_name ?? user.email ?? 'Unnamed User',
    avatarUrl: profileRow?.avatar_url ?? DEFAULT_AVATAR,
  };
}
