import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import SplitBlock from '../components/SplitBlock';
import { supabase } from '../lib/supabase';
import { getInstagramFeed } from '../lib/instagram';
import { pickShowcaseSellers } from '../lib/home-sellers';

// Server-rendered for SEO, but split into its own chunk so the scroll-motion
// code only ships with the homepage.
const HomeFeatures = dynamic(() => import('../components/HomeFeatures'), { ssr: true });

export default function Home({ houses = [], housesTotal = 0, instagram = null, sellers = [] }) {
  return (
    <>
      <Head>
        <title>PakFrag — Pakistan's Fragrance Community | Verified Sellers</title>
        <meta name="description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <link rel="canonical" href="https://pakfrag.com" />
        <meta property="og:title" content="PakFrag — Pakistan's Fragrance Community" />
        <meta property="og:description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <meta property="og:url" content="https://pakfrag.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://pakfrag.com/pfc-round.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pakfragcom" />
        <meta name="twitter:title" content="PakFrag — Pakistan's Fragrance Community" />
        <meta name="twitter:description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <meta name="twitter:image" content="https://pakfrag.com/pfc-round.png" />
      </Head>
      <div className="bg-black text-white font-sans">
        <Header />
        <Hero />
        <HomeFeatures houses={houses} housesTotal={housesTotal} sellers={sellers} />
        <Intro />
        <SplitBlock instagram={instagram} />
        <Footer />
      </div>
    </>
  );
}

const TIER_RANK = { platinum: 0, gold: 1, silver: 2 };

// Six houses for the homepage, best-presented first: logo + description,
// then sponsors and higher tiers. One bounded query, revalidated hourly.
export async function getStaticProps() {
  const [{ data: rows, error }, { count }, instagram, { data: sellerRows }] = await Promise.all([
    supabase
      .from('fragrance_houses')
      .select('house, slug, logo_url, description, tier, is_sponsor')
      .in('status', ['active', 'grace'])
      .order('is_sponsor', { ascending: false })
      .order('house')
      .limit(200),
    supabase
      .from('fragrance_houses')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'grace']),
    getInstagramFeed(),
    // Active sellers for the rotating verify card (public data, same as the search).
    supabase
      .from('sellers')
      .select('name, code, seller_type')
      .eq('status', 'active')
      .limit(300),
  ]);
  if (error) console.error('[home] houses fetch error:', error.message);

  const presentation = (h) => (h.logo_url ? 2 : 0) + (h.description && h.description.trim().length > 40 ? 1 : 0);
  const houses = (rows || [])
    .filter((h) => h.slug)
    .sort((a, b) =>
      presentation(b) - presentation(a) ||
      Number(b.is_sponsor) - Number(a.is_sponsor) ||
      (TIER_RANK[a.tier] ?? 3) - (TIER_RANK[b.tier] ?? 3) ||
      a.house.localeCompare(b.house))
    .slice(0, 6)
    .map(({ house, slug, logo_url, description }) => ({
      house, slug, logo_url: logo_url || null,
      description: description ? description.trim().slice(0, 140) : null,
    }));

  return {
    props: { houses, housesTotal: count || 0, instagram, sellers: pickShowcaseSellers(sellerRows, 8) },
    revalidate: 3600,
  };
}
