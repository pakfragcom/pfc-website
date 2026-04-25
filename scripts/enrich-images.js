#!/usr/bin/env node
/**
 * scripts/enrich-images.js
 *
 * Fetches fragrance images from OpenBeautyFacts and updates image_url in Supabase.
 * Only processes fragrances that currently have no image.
 *
 * Usage:
 *   node -r dotenv/config scripts/enrich-images.js dotenv_config_path=.env.local
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const OBF_BASE = 'https://world.openbeautyfacts.org/cgi/search.pl';
const UA = 'PakFragCommunity/1.0 (pakfrag.com; image-enrichment; contact@pakfrag.com)';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(str) {
  return str.toLowerCase()
    .replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[üù]/g, 'u')
    .replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function score(product, fragName, house) {
  const pName = normalize(product.product_name || '');
  const pBrands = normalize(product.brands || '');
  const frag = normalize(fragName);
  const h = normalize(house);

  let pts = 0;
  if (pName.includes(frag)) pts += 3;
  if (frag.includes(pName) && pName.length > 3) pts += 2;
  if (pBrands.includes(h) || h.includes(pBrands)) pts += 3;
  if (pName.includes(h)) pts += 1;
  return pts;
}

async function fetchOBF(query) {
  const url = `${OBF_BASE}?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&action=process`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function findImage(fragName, house) {
  // Try two queries: specific and broader
  const queries = [
    `${fragName} ${house}`,
    `${fragName}`,
  ];

  for (const q of queries) {
    const products = await fetchOBF(q);
    if (!products.length) continue;

    const ranked = products
      .filter(p => (p.image_front_url || p.image_url) && p.product_name)
      .map(p => ({ p, s: score(p, fragName, house) }))
      .sort((a, b) => b.s - a.s);

    if (ranked.length && ranked[0].s >= 4) {
      return ranked[0].p.image_front_url || ranked[0].p.image_url;
    }
  }
  return null;
}

async function main() {
  const { data: fragrances, error } = await supabase
    .from('fragrances')
    .select('id, name, house')
    .eq('status', 'approved')
    .is('image_url', null)
    .order('name');

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }

  console.log(`Processing ${fragrances.length} fragrances without images...\n`);

  let found = 0, notFound = 0, errors = 0;

  for (let i = 0; i < fragrances.length; i++) {
    const { id, name, house } = fragrances[i];
    const prefix = `[${i + 1}/${fragrances.length}]`;

    try {
      const imageUrl = await findImage(name, house);

      if (imageUrl) {
        const { error: updateErr } = await supabase
          .from('fragrances')
          .update({ image_url: imageUrl })
          .eq('id', id);

        if (updateErr) {
          console.log(`${prefix} ✗ DB error for ${name}: ${updateErr.message}`);
          errors++;
        } else {
          console.log(`${prefix} ✓ ${name} — ${house}`);
          found++;
        }
      } else {
        notFound++;
        if (notFound <= 20 || i % 50 === 0) {
          console.log(`${prefix} — ${name} — ${house} (no match)`);
        }
      }
    } catch (e) {
      console.error(`${prefix} Error: ${e.message}`);
      errors++;
    }

    // Respect OBF rate limits: ~1 req/sec (2 queries = 2 sec pause)
    await sleep(1100);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Found:     ${found}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors:    ${errors}`);
  console.log(`Total:     ${fragrances.length}`);
}

main();
