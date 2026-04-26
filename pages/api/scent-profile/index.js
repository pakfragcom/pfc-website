import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function buildSupabase(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          const existing = res.getHeader('Set-Cookie');
          const arr = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
          res.setHeader('Set-Cookie', [
            ...arr,
            ...cookiesToSet.map(({ name, value, options = {} }) => {
              let s = `${name}=${value}; Path=${options.path || '/'}`;
              if (options.httpOnly) s += '; HttpOnly';
              if (options.secure) s += '; Secure';
              if (options.sameSite) s += `; SameSite=${options.sameSite}`;
              if (options.maxAge !== undefined) s += `; Max-Age=${options.maxAge}`;
              return s;
            }),
          ]);
        },
      },
    }
  );
}

export default async function handler(req, res) {
  const supabase = buildSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // GET — return own scent profile
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('scent_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — upsert scent profile
  if (req.method === 'POST') {
    const { preferred_families, usage_occasions, budget_range, city, current_scents } = req.body;

    const { data, error } = await supabaseAdmin
      .from('scent_profiles')
      .upsert({
        user_id: user.id,
        preferred_families: preferred_families || [],
        usage_occasions: usage_occasions || [],
        budget_range: budget_range || null,
        city: city || null,
        current_scents: current_scents || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
