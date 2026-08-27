import { supabaseAdmin } from './supabase-admin';

// Family → keyword groups (any match in notes_top/heart/base or name)
export const FAMILY_KEYWORDS = {
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

const CACHE_TTL_MS = 5 * 60_000; // matches recommendations.js's existing Cache-Control max-age

let cache = { byFamily: null, expiresAt: 0 };
let inflight = null;

function matchesFamily(frag, family) {
  const haystack = [frag.name, frag.house, frag.notes_top, frag.notes_heart, frag.notes_base].join(' ').toLowerCase();
  return (FAMILY_KEYWORDS[family] || []).some(kw => haystack.includes(kw));
}

async function computeCatalog() {
  const { data: fragrances } = await supabaseAdmin
    .from('fragrances')
    .select('id, name, slug, house, category, image_url, notes_top, notes_heart, notes_base')
    .eq('status', 'approved');

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

  const enriched = (fragrances || []).map(frag => {
    const entry = ratingMap[frag.id];
    const avgRating = entry ? entry.sum / entry.count : 0;
    return {
      ...frag,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: entry?.count || 0,
    };
  });

  // Precompute, per family, the fragrances that match it — the part that's
  // identical for every visitor, so it only needs recomputing once per TTL
  // window rather than on every homepage view.
  const byFamily = {};
  for (const family of Object.keys(FAMILY_KEYWORDS)) {
    byFamily[family] = enriched.filter(f => matchesFamily(f, family));
  }
  return byFamily;
}

/** Returns { [family]: fragrance[] }, refreshed at most once per CACHE_TTL_MS. */
export async function getFamilyCatalog() {
  if (cache.byFamily && Date.now() < cache.expiresAt) return cache.byFamily;
  if (!inflight) {
    inflight = computeCatalog()
      .then(byFamily => {
        cache = { byFamily, expiresAt: Date.now() + CACHE_TTL_MS };
        inflight = null;
        return byFamily;
      })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}
