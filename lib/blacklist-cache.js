import { supabaseAdmin } from './supabase-admin';

// Same rationale as lib/sellers-cache.js: /tools/verify-seller is the site's
// highest-traffic page, and this table only changes via direct Supabase
// dashboard edits (no admin UI yet), so a plain TTL — no invalidate() hook —
// is enough; a few minutes of staleness after an edit is an acceptable
// trade-off for not hitting Supabase on every toggle click.
const CACHE_TTL_MS = 5 * 60_000;

let cache = { rows: null, expiresAt: 0 };
let inflight = null;

async function fetchRows() {
  const { data } = await supabaseAdmin
    .from('blacklisted_sellers')
    .select('name, reason, added_at')
    .order('added_at', { ascending: false })
    .limit(200);
  return data || [];
}

/** Returns the blacklisted-sellers list, refreshed at most once per CACHE_TTL_MS. */
export async function getBlacklistCache() {
  if (cache.rows && Date.now() < cache.expiresAt) return cache.rows;
  if (!inflight) {
    inflight = fetchRows()
      .then(rows => {
        cache = { rows, expiresAt: Date.now() + CACHE_TTL_MS };
        inflight = null;
        return rows;
      })
      .catch(err => { inflight = null; throw err; });
  }
  return inflight;
}
