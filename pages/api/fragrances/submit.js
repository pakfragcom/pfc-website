import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const VALID_CATEGORIES = ['designer', 'middle_eastern', 'niche', 'local'];

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);
}

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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    name, house, category, concentration, description,
    image_url, notes_top, notes_heart, notes_base, year_released,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Fragrance name is required.' });
  if (!house?.trim()) return res.status(400).json({ error: 'House / brand is required.' });
  if (!category || !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Please select a valid category.' });

  const slug = slugify(name);

  const { data, error } = await supabaseAdmin.from('fragrances').insert({
    name: name.trim(),
    slug,
    house: house.trim(),
    category,
    concentration: concentration?.trim() || null,
    description: description?.trim() || null,
    image_url: image_url?.trim() || null,
    notes_top: notes_top?.trim() || null,
    notes_heart: notes_heart?.trim() || null,
    notes_base: notes_base?.trim() || null,
    year_released: year_released ? Number(year_released) : null,
    status: 'pending',
    submitted_by: user.id,
  }).select('slug').single();

  if (error) {
    if (error.code === '23505') {
      // Slug collision — retry once with a new suffix
      const slug2 = slugify(name);
      const { data: d2, error: e2 } = await supabaseAdmin.from('fragrances').insert({
        name: name.trim(), slug: slug2, house: house.trim(), category,
        concentration: concentration?.trim() || null,
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        notes_top: notes_top?.trim() || null,
        notes_heart: notes_heart?.trim() || null,
        notes_base: notes_base?.trim() || null,
        year_released: year_released ? Number(year_released) : null,
        status: 'pending', submitted_by: user.id,
      }).select('slug').single();
      if (e2) return res.status(400).json({ error: e2.message });
      return res.status(200).json({ ok: true, slug: d2.slug });
    }
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, slug: data.slug });
}
