'use client';

import { useEffect, useRef, useState } from 'react';
import { PageWrapper } from '@/app/components/PageWrapper';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

const INVALID_LINK_MESSAGE = 'Invite link is invalid or has expired. Please contact an administrator.';

/**
 * Landing point for Supabase Auth email links (invite, magic link, password recovery) — see
 * docs/04-rbac-security.md §14.
 *
 * This MUST be a client component, not a Route Handler. Supabase's own /auth/v1/verify endpoint
 * (hit when the user clicks the email link) hands the resulting session back as a URL hash
 * fragment — `#access_token=...&refresh_token=...&type=invite` — not a `?code=` query param.
 * Hash fragments are never sent in the HTTP request, so a server-side route.ts can never see
 * them; only browser JS reading `window.location.hash` can. (A previous route.ts version here
 * only ever checked `?code=`, which is why every single invite link failed with "invalid or
 * expired" regardless of whether it actually was.) `?code=` is still handled as a fallback for
 * any flow that does use PKCE.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Hard navigation (window.location), not router.replace/push: proxy.ts's middleware decides
    // whether to allow /auth/set-password by reading the session cookie on the NEXT request. A
    // client-side router.replace fires that next request immediately after setSession() resolves,
    // but @supabase/ssr's cookie-backed browser client writes those cookies slightly after the
    // promise resolves — the middleware was consistently losing that race and seeing no session
    // yet, silently bouncing to /login (no error text, since it's proxy.ts's plain "not logged
    // in" redirect, not this page's error path). A full navigation only fires once the browser
    // has fully committed the Set-Cookie-equivalent writes from setSession, so the race is gone.
    const goTo = (url: string) => {
      window.location.replace(url);
    };

    const run = async () => {
      const supabase = createClient();
      const search = new URLSearchParams(window.location.search);
      const next = search.get('next') ?? '/auth/set-password';

      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashError = hashParams.get('error_description') || hashParams.get('error');

      if (hashError) {
        setError(INVALID_LINK_MESSAGE);
        goTo(`/login?error=${encodeURIComponent(INVALID_LINK_MESSAGE)}`);
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setError(INVALID_LINK_MESSAGE);
          goTo(`/login?error=${encodeURIComponent(INVALID_LINK_MESSAGE)}`);
          return;
        }
        goTo(next);
        return;
      }

      const code = search.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          goTo(next);
          return;
        }
      }

      setError(INVALID_LINK_MESSAGE);
      goTo(`/login?error=${encodeURIComponent(INVALID_LINK_MESSAGE)}`);
    };

    run();
  }, []);

  return (
    <PageWrapper className="min-h-screen w-full flex items-center justify-center bg-[#fbf9fb]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <p className="text-xs font-semibold text-slate-500">
          {error ?? 'Signing you in...'}
        </p>
      </div>
    </PageWrapper>
  );
}
