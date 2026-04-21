const CONC_MAP = [
  [/\bparfum\b/i, 'Parfum'],
  [/\bedp\b|eau\s+de\s+parfum/i, 'EDP'],
  [/\bedt\b|eau\s+de\s+toilette/i, 'EDT'],
  [/\bedc\b|eau\s+de\s+cologne/i, 'EDC'],
  [/\bbody\s+spray\b/i, 'Body Spray'],
];

function detectConcentration(name) {
  for (const [re, label] of CONC_MAP) {
    if (re.test(name)) return label;
  }
  return null;
}

function detectYear(text) {
  const m = text?.match(/\b(19[5-9]\d|20[012]\d)\b/);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchDDG(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' fragrance')}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetch(url, { headers: { 'User-Agent': 'PFC-Website/1.0' } });
    if (!r.ok) return null;
    const d = await r.json();
    const image = d.Image
      ? (d.Image.startsWith('/i/') ? 'https://duckduckgo.com' + d.Image : d.Image)
      : null;
    return { image, description: d.AbstractText || null };
  } catch {
    return null;
  }
}

async function fetchWikipedia(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' perfume')}&format=json&utf8=1&srlimit=1&origin=*`;
    const sr = await fetch(searchUrl, { headers: { 'User-Agent': 'PFC-Website/1.0' } });
    if (!sr.ok) return null;
    const sd = await sr.json();
    const title = sd?.query?.search?.[0]?.title;
    if (!title) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const pr = await fetch(summaryUrl, { headers: { 'User-Agent': 'PFC-Website/1.0' } });
    if (!pr.ok) return null;
    const pd = await pr.json();
    return {
      image: pd.thumbnail?.source || null,
      description: pd.extract || null,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { name, house } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const query = house ? `${name} ${house}` : name;

  const [ddg, wiki] = await Promise.all([fetchDDG(query), fetchWikipedia(query)]);

  const image_url = wiki?.image || ddg?.image || null;
  const description = wiki?.description || ddg?.description || null;
  const concentration = detectConcentration(name);
  const year_released = detectYear(wiki?.description || ddg?.description || '');

  const found = !!(image_url || description);
  return res.status(200).json({ found, image_url, description, concentration, year_released });
}
