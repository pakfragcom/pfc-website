import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!supabase) { router.replace('/auth/login'); return; }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const next = params.get('next') || '/';

    if (!code) { router.replace('/auth/login'); return; }

    // createBrowserClient stores the PKCE verifier in cookies so it survives
    // the full-page OAuth redirect and is available here for exchange.
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace('/auth/login?error=' + encodeURIComponent(error.message));
      } else {
        router.replace(next);
      }
    });
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <svg className="mx-auto h-8 w-8 animate-spin text-[#557d72]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="mt-4 text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}
