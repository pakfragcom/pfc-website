import { supabaseAdmin } from './supabase-admin';

// /tools/verify-seller is the site's highest-traffic page, and its search box
// fires a query on every debounced keystroke — without this, each one hit
// Supabase directly. Sellers (active/grace, used for public search) rarely
// change — only via the admin panel — so this is the same shared-across-
// visitors TTL cache pattern as lib/recommendation-cache.js, with a manual
// invalidate() hook so admin edits (pages/api/admin/sellers.js) still show
// up immediately instead of waiting out the TTL.
const CACHE_TTL_MS = 5 * 60_000;

let cache = { rows: null, expiresAt: 0 };
let inflight = null;

async function fetchRows() {
  const { data } = await supabaseAdmin
    .from('sellers')
    .select('name, code, seller_type, slug, verification_tier')
    .in('status', ['active', 'grace'])
    .order('name')
    .limit(1000);
  return data || [];
}

/** Returns the active+grace seller list, refreshed at most once per CACHE_TTL_MS. */
export async function getSellersCache() {
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

/** Call after any admin write to the sellers table so search reflects it immediately. */
export function invalidateSellersCache() {
  cache = { rows: null, expiresAt: 0 };
}
