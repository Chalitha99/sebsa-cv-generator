import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Landing point for Supabase Auth email links (invite, magic link, password recovery) — see
 * docs/04-rbac-security.md §14. Supabase's own /auth/v1/verify endpoint redirects here with a
 * PKCE `code` param after the user clicks the link; we exchange it for a session cookie, then
 * forward to `next` (defaults to /auth/set-password, since this route is currently only wired
 * up to the invite flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auth/set-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'Invite link is invalid or has expired. Please contact an administrator.');
  return NextResponse.redirect(redirectUrl);
}
