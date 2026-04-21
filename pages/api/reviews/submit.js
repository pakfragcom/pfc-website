import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth — read session from PKCE cookies
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Validate
  const {
    fragrance_name, house, category, fragrance_id,
    rating_overall, rating_longevity, rating_sillage, rating_value,
    review_text, occasion, season,
  } = req.body;

  if (!fragrance_name?.trim()) return res.status(400).json({ error: 'Fragrance name is required.' });
  if (!house?.trim())          return res.status(400).json({ error: 'House / brand is required.' });
  if (!category)               return res.status(400).json({ error: 'Please select a category.' });
  if (!rating_overall)         return res.status(400).json({ error: 'Please give an overall rating.' });
  if (!review_text || review_text.trim().length < 80)
    return res.status(400).json({ error: 'Review must be at least 80 characters.' });

  // Ensure profile exists (admin client bypasses RLS)
  const rawName = user.user_metadata?.full_name || user.user_metadata?.name
    || user.email?.split('@')[0] || 'User';
  const base = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'user';
  const username = `${base}-${user.id.slice(0, 6)}`;

  await supabaseAdmin.from('profiles').upsert(
    { id: user.id, username, display_name: rawName },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // Insert review
  const { error: reviewError } = await supabaseAdmin.from('reviews').insert({
    author_id:        user.id,
    slug:             slugify(fragrance_name),
    fragrance_name:   fragrance_name.trim(),
    house:            house.trim(),
    category,
    fragrance_id:     fragrance_id || null,
    rating_overall:   Number(rating_overall),
    rating_longevity: rating_longevity ? Number(rating_longevity) : null,
    rating_sillage:   rating_sillage   ? Number(rating_sillage)   : null,
    rating_value:     rating_value     ? Number(rating_value)     : null,
    review_text:      review_text.trim(),
    occasion:         occasion || null,
    season:           season   || null,
  });

  if (reviewError) return res.status(400).json({ error: reviewError.message });
  return res.status(200).json({ ok: true });
}
