// SERVER-ONLY: latest Instagram posts for the homepage, via the official
// Instagram API (Instagram Login). Called from the homepage getStaticProps,
// so it runs at most once an hour (ISR), never per visitor.
// The long-lived token lives in public.integration_tokens (key 'instagram')
// and is refreshed here when it is more than 7 days old (tokens last 60 days;
// Instagram allows a refresh once the token is 24h old).
// Any failure returns null and the homepage shows its normal picture instead.
import { supabaseAdmin } from './supabase-admin';

const GRAPH = 'https://graph.instagram.com';
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

async function getJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
    return j;
  } finally {
    clearTimeout(t);
  }
}

/** Pure: Instagram media rows → up to `limit` displayable posts. */
export function toPosts(rows, limit = 6) {
  return (Array.isArray(rows) ? rows : [])
    .map((m) => {
      const image = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
      if (!image || !m.permalink || !/^https:\/\//.test(image) || !/^https:\/\/(www\.)?instagram\.com\//.test(m.permalink)) return null;
      const caption = typeof m.caption === 'string' ? m.caption.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
      return { id: String(m.id), image, permalink: m.permalink, caption, isVideo: m.media_type === 'VIDEO' };
    })
    .filter(Boolean)
    .slice(0, limit);
}

export async function getInstagramFeed() {
  try {
    const { data: row } = await supabaseAdmin
      .from('integration_tokens')
      .select('value, updated_at')
      .eq('key', 'instagram')
      .maybeSingle();
    let token = row?.value?.trim();
    if (!token) return null;

    if (Date.now() - new Date(row.updated_at).getTime() > REFRESH_AFTER_MS) {
      try {
        const r = await getJson(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
        if (r.access_token) {
          token = r.access_token;
          await supabaseAdmin
            .from('integration_tokens')
            .update({ value: token, updated_at: new Date().toISOString() })
            .eq('key', 'instagram');
        }
      } catch (e) {
        console.error('[instagram] token refresh failed:', e.message);
      }
    }

    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const [me, media] = await Promise.all([
      getJson(`${GRAPH}/me?fields=username&access_token=${encodeURIComponent(token)}`),
      getJson(`${GRAPH}/me/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`),
    ]);
    const posts = toPosts(media.data);
    if (posts.length < 3) return null;
    return { username: me.username || null, posts };
  } catch (e) {
    console.error('[instagram] feed fetch failed:', e.message);
    return null;
  }
}
