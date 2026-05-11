import { resolveApiAuth } from '../../../../lib/api-auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = await resolveApiAuth(req, res);
  if (!auth.ok) return;

  const { name, house, q } = req.query;
  if (!name && !q) return res.status(400).json({ error: 'name or q required' });

  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx  = process.env.GOOGLE_SEARCH_CX;
  if (!key || !cx) return res.status(500).json({ error: 'Image search not configured' });

  const query = q || `${name}${house ? ' ' + house : ''} perfume`;

  try {
    const params = new URLSearchParams({
      key,
      cx,
      q:          query,
      searchType: 'image',
      num:        '8',
      imgSize:    'large',
      imgType:    'photo',
      safe:       'active',
    });

    const r = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || 'Search failed', results: [] });
    }

    const data = await r.json();
    const results = (data.items || []).map(item => ({
      thumb: item.image?.thumbnailLink || '',
      url:   item.link,
      title: item.title,
      host:  (() => { try { return new URL(item.image?.contextLink || '').hostname.replace('www.', ''); } catch { return ''; } })(),
    }));

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message, results: [] });
  }
}
