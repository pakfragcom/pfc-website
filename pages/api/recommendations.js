import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '../../lib/supabase-admin';

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

// Family → keyword groups (any match in notes_top/heart/base or name)
const FAMILY_KEYWORDS = {
  Oud:       ['oud', 'agarwood', 'aoud', 'bakhoor', 'agar'],
  Woody:     ['wood', 'cedar', 'sandalwood', 'vetiver', 'patchouli', 'guaiac', 'birch', 'oak'],
  Fresh:     ['fresh', 'green', 'ozonic', 'aquatic', 'light', 'clean', 'crisp', 'dewy'],
  Floral:    ['rose', 'jasmine', 'lily', 'iris', 'peony', 'violet', 'gardenia', 'tuberose', 'floral', 'flower'],
  Sweet:     ['vanilla', 'caramel', 'honey', 'tonka', 'praline', 'gourmand', 'sugar', 'cocoa', 'chocolate'],
  Spicy:     ['pepper', 'cinnamon', 'cardamom', 'clove', 'ginger', 'saffron', 'spice', 'nutmeg', 'chili'],
  Citrus:    ['lemon', 'bergamot', 'orange', 'grapefruit', 'lime', 'mandarin', 'citrus', 'yuzu', 'neroli'],
  Oriental:  ['amber', 'incense', 'resin', 'myrrh', 'benzoin', 'balsam', 'oriental', 'musk', 'labdanum'],
  Musk:      ['musk', 'ambrette', 'cashmeran', 'musky', 'skin'],
  Aquatic:   ['aquatic', 'marine', 'ocean', 'sea', 'water', 'watery', 'ozonic'],
};

function scoreFragrance(frag, families) {
  const haystack = [
    frag.name, frag.house, frag.notes_top, frag.notes_heart, frag.notes_base
  ].join(' ').toLowerCase();

  let score = 0;
  for (const family of families) {
    const keywords = FAMILY_KEYWORDS[family] || [];
    for (const kw of keywords) {
      if (haystack.includes(kw)) { score += 2; break; } // +2 per matched family
    }
  }
  return score;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = buildSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // Fetch scent profile
  const { data: profile } = await supabaseAdmin
    .from('scent_profiles')
    .select('preferred_families, budget_range')
    .eq('user_id', user.id)
    .maybeSingle();

  const families = profile?.preferred_families?.length ? profile.preferred_families : Object.keys(FAMILY_KEYWORDS);

  // Fetch all approved fragrances
  const { data: fragrances, error: fragErr } = await supabaseAdmin
    .from('fragrances')
    .select('id, name, slug, house, category, image_url, notes_top, notes_heart, notes_base')
    .eq('status', 'approved');

  if (fragErr) return res.status(500).json({ error: fragErr.message });

  // Fetch average ratings per fragrance
  const { data: ratings } = await supabaseAdmin
    .from('reviews')
    .select('fragrance_id, rating_overall')
    .eq('status', 'approved')
    .not('fragrance_id', 'is', null);

  const ratingMap = {};
  for (const r of ratings || []) {
    if (!ratingMap[r.fragrance_id]) ratingMap[r.fragrance_id] = { sum: 0, count: 0 };
    ratingMap[r.fragrance_id].sum += Number(r.rating_overall);
    ratingMap[r.fragrance_id].count += 1;
  }

  // Score and rank
  const scored = (fragrances || []).map(frag => {
    const familyScore = scoreFragrance(frag, families);
    const ratingEntry = ratingMap[frag.id];
    const avgRating   = ratingEntry ? ratingEntry.sum / ratingEntry.count : 0;
    const reviewCount = ratingEntry?.count || 0;
    // Combined score: family match weighted heavily, then rating
    const total = familyScore * 10 + avgRating * 2 + Math.min(reviewCount, 10);
    return { ...frag, avgRating: Math.round(avgRating * 10) / 10, reviewCount, _score: total };
  });

  scored.sort((a, b) => b._score - a._score);

  const top = scored.slice(0, 12).map(({ _score, notes_top, notes_heart, notes_base, ...f }) => f);

  // Determine primary matching family for "Because you like X" label
  const primaryFamily = families[0] || null;

  return res.status(200).json({ recommendations: top, primaryFamily, families });
}
