import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { fragrance_id } = req.body;
  if (!fragrance_id) return res.status(400).json({ error: 'fragrance_id required' });

  // Check if already wishlisted
  const { data: existing } = await supabaseAdmin
    .from('fragrance_wishlist')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('fragrance_id', fragrance_id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('fragrance_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('fragrance_id', fragrance_id);
    return res.status(200).json({ wishlisted: false });
  } else {
    await supabaseAdmin
      .from('fragrance_wishlist')
      .insert({ user_id: user.id, fragrance_id });
    return res.status(200).json({ wishlisted: true });
  }
}
