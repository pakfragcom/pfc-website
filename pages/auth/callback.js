import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';

// Handles OAuth redirects and email confirmation links.
// Supabase redirects here with ?code= — we exchange it for a session.
export default function AuthCallback() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        const next = router.query.next || '/';
        router.replace(next);
      }
    });
    return () => subscription.unsubscribe();
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
