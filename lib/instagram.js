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

const FB_GRAPH = 'https://graph.facebook.com';
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

async function saveToken(key, value) {
  await supabaseAdmin
    .from('integration_tokens')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

// Last outcome, readable by the admin in Supabase (never contains the token).
async function saveStatus(text) {
  try { await saveToken('instagram_status', `${new Date().toISOString()} ${text}`.slice(0, 500)); } catch {}
}

/**
 * Facebook-style token ("EAA…", from the dashboard's unified / Facebook
 * login). Works out the Instagram account id once and stores it. When the
 * token is a user token with a linked Page, it switches to that Page's token,
 * which does not expire when derived from a long-lived user token.
 */
async function fetchViaFacebookGraph(token, knownIgId) {
  const t = encodeURIComponent(token);
  let igId = knownIgId;
  if (!igId) {
    // Unified login: the token itself may belong to the Instagram account.
    try {
      const me = await getJson(`${FB_GRAPH}/me?fields=id,username,media_count&access_token=${t}`);
      if (me.username && typeof me.media_count === 'number') igId = me.id;
    } catch {}
  }
  if (!igId) {
    const acc = await getJson(`${FB_GRAPH}/me/accounts?fields=access_token,instagram_business_account{id,username}&limit=25&access_token=${t}`);
    const page = (acc.data || []).find((p) => p.instagram_business_account?.id);
    if (!page) throw new Error('no Instagram account linked to this token');
    igId = page.instagram_business_account.id;
    if (page.access_token) {
      token = page.access_token;
      await saveToken('instagram', token);
    }
  }
  if (igId !== knownIgId) await saveToken('instagram_ig_id', igId);

  const j = await getJson(`${FB_GRAPH}/${igId}?fields=username,media.limit(12){${MEDIA_FIELDS}}&access_token=${encodeURIComponent(token)}`);
  return { username: j.username || null, rows: j.media?.data || [] };
}

export async function getInstagramFeed() {
  try {
    const { data: rows } = await supabaseAdmin
      .from('integration_tokens')
      .select('key, value, updated_at')
      .in('key', ['instagram', 'instagram_ig_id'])
      .limit(2);
    const row = (rows || []).find((r) => r.key === 'instagram');
    const igIdRow = (rows || []).find((r) => r.key === 'instagram_ig_id');
    let token = row?.value?.trim();
    if (!token) return null;

    if (token.startsWith('EAA')) {
      const { username, rows: media } = await fetchViaFacebookGraph(token, igIdRow?.value || null);
      const posts = toPosts(media);
      await saveStatus(`ok via facebook graph: ${posts.length} posts${username ? ` from @${username}` : ''}`);
      return posts.length >= 3 ? { username, posts } : null;
    }

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

    const [me, media] = await Promise.all([
      getJson(`${GRAPH}/me?fields=username&access_token=${encodeURIComponent(token)}`),
      getJson(`${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=12&access_token=${encodeURIComponent(token)}`),
    ]);
    const posts = toPosts(media.data);
    await saveStatus(`ok via instagram graph: ${posts.length} posts${me.username ? ` from @${me.username}` : ''}`);
    if (posts.length < 3) return null;
    return { username: me.username || null, posts };
  } catch (e) {
    // Meta error messages do not echo the token, but strip anything token-like anyway.
    const msg = String(e.message || e).replace(/(EAA|IG)[A-Za-z0-9_-]{20,}/g, '[token]');
    console.error('[instagram] feed fetch failed:', msg);
    await saveStatus(`error: ${msg}`);
    return null;
  }
}
