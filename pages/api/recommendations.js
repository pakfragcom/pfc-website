import { supabaseAdmin } from '../../lib/supabase-admin';
import { createApiSupabaseClient } from '../../lib/server-supabase';
import { getFamilyCatalog, FAMILY_KEYWORDS } from '../../lib/recommendation-cache';

const ALL_FAMILIES = Object.keys(FAMILY_KEYWORDS);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createApiSupabaseClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // Single indexed row — cheap, unlike the catalog-wide work below.
  const { data: profile } = await supabaseAdmin
    .from('scent_profiles')
    .select('preferred_families')
    .eq('user_id', user.id)
    .maybeSingle();

  const families = profile?.preferred_families?.length ? profile.preferred_families : ALL_FAMILIES;

  // Shared, TTL-cached across all visitors — the full-table fetch + family
  // matching only actually runs once per cache window, not once per request.
  const byFamily = await getFamilyCatalog();

  // Merge matches across the user's families; a fragrance matching more of
  // the user's preferred families ranks higher (mirrors the old +2-per-family
  // scoring, just computed over the cached per-family lists instead of a
  // fresh full-table scan).
  const merged = new Map();
  for (const family of families) {
    for (const frag of byFamily[family] || []) {
      const entry = merged.get(frag.id) || { frag, familyMatches: 0 };
      entry.familyMatches += 1;
      merged.set(frag.id, entry);
    }
  }

  const scored = Array.from(merged.values()).map(({ frag, familyMatches }) => {
    const total = familyMatches * 20 + frag.avgRating * 2 + Math.min(frag.reviewCount, 10);
    return { ...frag, _score: total };
  });
  scored.sort((a, b) => b._score - a._score);

  const top = scored.slice(0, 12).map(({ _score, notes_top, notes_heart, notes_base, ...f }) => f);
  const primaryFamily = families[0] || null;

  res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
  return res.status(200).json({ recommendations: top, primaryFamily, families });
}
