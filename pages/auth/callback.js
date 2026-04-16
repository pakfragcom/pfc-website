import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!supabase) { router.replace('/auth/login'); return; }

    const next = new URLSearchParams(window.location.search).get('next') || '/';

    // With implicit flow, Supabase puts the session in the URL hash.
    // getSession() auto-processes the hash and returns the session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(next);
        return;
      }
      // Fallback: wait for onAuthStateChange in case timing is off
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          router.replace(next);
        }
      });
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        router.replace('/auth/login?error=Sign-in+timed+out.+Please+try+again.');
      }, 8000);
      return () => { clearTimeout(timeout); subscription.unsubscribe(); };
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
