import { createServerClient } from '@supabase/ssr';

export async function getServerSideProps({ req, res, query }) {
  const code = query.code;
  const next = query.next || '/';

  if (!code) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          const existing = res.getHeader('Set-Cookie');
          const existingArr = existing
            ? Array.isArray(existing) ? existing : [existing]
            : [];
          res.setHeader('Set-Cookie', [
            ...existingArr,
            ...cookiesToSet.map(({ name, value, options = {} }) => {
              let str = `${name}=${value}; Path=${options.path || '/'}`;
              if (options.httpOnly) str += '; HttpOnly';
              if (options.secure) str += '; Secure';
              if (options.sameSite) str += `; SameSite=${options.sameSite}`;
              if (options.maxAge !== undefined) str += `; Max-Age=${options.maxAge}`;
              return str;
            }),
          ]);
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return {
      redirect: {
        destination: '/auth/login?error=' + encodeURIComponent(error.message),
        permanent: false,
      },
    };
  }

  return { redirect: { destination: next, permanent: false } };
}

export default function AuthCallback() {
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
