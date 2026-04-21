import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

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

  const { id, review_text, rating_overall, rating_longevity, rating_sillage, rating_value, occasion, season, cover_image_url } = req.body;

  if (!id) return res.status(400).json({ error: 'Review ID required' });
  if (!review_text || review_text.trim().length < 80) return res.status(400).json({ error: 'Review must be at least 80 characters' });
  if (!rating_overall || Number(rating_overall) < 1 || Number(rating_overall) > 5) return res.status(400).json({ error: 'Overall rating must be between 1 and 5' });

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Review not found' });
  if (existing.author_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  const { data: updated, error } = await supabaseAdmin
    .from('reviews')
    .update({
      review_text: review_text.trim(),
      rating_overall: Number(rating_overall),
      rating_longevity: rating_longevity ? Number(rating_longevity) : null,
      rating_sillage: rating_sillage ? Number(rating_sillage) : null,
      rating_value: rating_value ? Number(rating_value) : null,
      occasion: occasion || null,
      season: season || null,
      cover_image_url: cover_image_url?.trim() || null,
    })
    .eq('id', id)
    .eq('author_id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ review: updated });
}
