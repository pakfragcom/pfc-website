// Local builds read Supabase creds from .env.local via dotenv; on Vercel these
// are already real env vars, so this call is a harmless no-op there.
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://pakfrag.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: '/pfc-mgmt' },
    ],
    additionalSitemaps: ['https://forum.pakfrag.com/sitemap.xml'],
  },
  exclude: [
    '/pfc-mgmt',
    '/pfc-mgmt/*',
    '/u/me',
    '/auth/callback',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,

  // Dynamic routes ([slug]/[id] pages) use getStaticPaths: { paths: [] } so
  // Vercel doesn't pre-render hundreds of pages on every deploy (a deliberate
  // fix for excessive build-time Fluid CPU usage). next-sitemap's default
  // scanner only sees static page files, so without this it silently produces
  // a sitemap containing zero fragrance/review/house/seller/profile/listing
  // pages — exactly the content this site exists to rank in search. Query the
  // same tables with the same status filters the pages themselves use.
  additionalPaths: async (config) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('[next-sitemap] Missing Supabase env vars — skipping dynamic paths');
      return [];
    }
    const supabase = createClient(url, key);

    const [
      { data: fragrances, error: fragrancesError },
      { data: reviews, error: reviewsError },
      { data: houses, error: housesError },
      { data: sellers, error: sellersError },
      { data: profiles, error: profilesError },
      { data: listings, error: listingsError },
    ] = await Promise.all([
      supabase.from('fragrances').select('slug').eq('status', 'approved'),
      supabase.from('reviews').select('slug').eq('status', 'approved'),
      supabase.from('fragrance_houses').select('slug').in('status', ['active', 'grace']),
      supabase.from('sellers').select('slug').in('status', ['active', 'grace']),
      supabase.from('profiles').select('username').not('username', 'is', null),
      supabase.from('listings').select('id').eq('status', 'active').gt('expires_at', new Date().toISOString()),
    ]);

    for (const [label, err] of [
      ['fragrances', fragrancesError], ['reviews', reviewsError], ['houses', housesError],
      ['sellers', sellersError], ['profiles', profilesError], ['listings', listingsError],
    ]) {
      if (err) console.error(`[next-sitemap] ${label} fetch error:`, err.message);
    }

    const paths = [];
    for (const f of fragrances || []) if (f.slug) paths.push(await config.transform(config, `/fragrances/${f.slug}`));
    for (const r of reviews || [])    if (r.slug) paths.push(await config.transform(config, `/reviews/${r.slug}`));
    for (const h of houses || [])     if (h.slug) paths.push(await config.transform(config, `/houses/${h.slug}`));
    for (const s of sellers || [])    if (s.slug) paths.push(await config.transform(config, `/sellers/${s.slug}`));
    for (const p of profiles || [])   if (p.username) paths.push(await config.transform(config, `/u/${p.username}`));
    for (const l of listings || [])   paths.push(await config.transform(config, `/marketplace/${l.id}`));

    console.log(`[next-sitemap] Added ${paths.length} dynamic paths (${(fragrances||[]).length} fragrances, ${(reviews||[]).length} reviews, ${(houses||[]).length} houses, ${(sellers||[]).length} sellers, ${(profiles||[]).length} profiles, ${(listings||[]).length} listings)`);
    return paths;
  },
}
