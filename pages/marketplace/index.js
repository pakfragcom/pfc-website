import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { trackEvent } from '../../lib/analytics';

const CONDITION_LABEL = {
  sealed:   { label: 'Sealed',    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10'         },
  partial:  { label: 'Partial',   color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'   },
  decant:   { label: 'Decant',    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'},
  gift_set: { label: 'Gift Set',  color: 'text-pink-400 border-pink-500/30 bg-pink-500/10'      },
};

const TIER_BADGE = {
  1: { label: 'L1', cls: 'text-emerald-400 ring-emerald-500/25' },
  2: { label: 'L2', cls: 'text-sky-400 ring-sky-500/25' },
  3: { label: 'L3', cls: 'text-amber-400 ring-amber-500/25' },
};

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest first' },
  { id: 'price_asc',  label: 'Price: low → high' },
  { id: 'price_desc', label: 'Price: high → low' },
];

const PAKISTAN_CITIES = [
  'All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot',
];

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function ConditionBadge({ condition }) {
  const cfg = CONDITION_LABEL[condition] || { label: condition, color: 'text-gray-400 border-white/10 bg-white/5' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ListingCard({ listing }) {
  const seller = listing.sellers;
  const daysLeft = Math.max(0, Math.round(
    (new Date(listing.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition overflow-hidden"
    >
      {/* Image or placeholder */}
      <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.fragrance_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 p-4 text-center">
            <span className="text-4xl font-black text-white/10 leading-none">
              {listing.fragrance_name[0]?.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider truncate max-w-full px-2">
              {listing.house}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white leading-tight truncate group-hover:text-[#94aea7] transition">
              {listing.fragrance_name}
            </h2>
            <p className="text-xs text-gray-500 truncate mt-0.5">{listing.house}</p>
          </div>
          <ConditionBadge condition={listing.condition} />
        </div>

        {listing.fill_level_pct && listing.condition !== 'sealed' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#557d72]"
                style={{ width: `${listing.fill_level_pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{listing.fill_level_pct}%</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span className="text-base font-bold text-white">Rs {listing.price_pkr?.toLocaleString()}</span>
            {listing.is_negotiable && (
              <span className="ml-1.5 text-[10px] text-gray-500">nego</span>
            )}
          </div>
          {listing.city && (
            <span className="text-[11px] text-gray-500">{listing.city}</span>
          )}
        </div>

        {seller && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-bold ring-1 ring-emerald-500/20">
              {seller.name?.[0]?.toUpperCase()}
            </span>
            <span className="text-[11px] text-gray-400 truncate">{seller.name}</span>
            {TIER_BADGE[seller.verification_tier] && (
              <span className={`ml-auto shrink-0 text-[9px] font-bold ring-1 rounded px-1 py-0.5 ${TIER_BADGE[seller.verification_tier].cls}`}>
                {TIER_BADGE[seller.verification_tier].label}
              </span>
            )}
            {!TIER_BADGE[seller.verification_tier] && daysLeft <= 5 && daysLeft > 0 && (
              <span className="ml-auto text-[10px] text-amber-400">{daysLeft}d left</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MarketplacePage({ listings = [], lastUpdated }) {
  const [query, setQuery]         = useState('');
  const [condition, setCondition] = useState('ALL');
  const [city, setCity]           = useState('All Cities');
  const [sort, setSort]           = useState('newest');

  const filtered = useMemo(() => {
    let pool = listings;

    if (condition !== 'ALL') pool = pool.filter(l => l.condition === condition);
    if (city !== 'All Cities') pool = pool.filter(l => l.city === city);

    if (query.trim()) {
      const q = normalize(query);
      pool = pool.filter(l =>
        normalize(l.fragrance_name).includes(q) ||
        normalize(l.house).includes(q) ||
        normalize(l.sellers?.name || '').includes(q)
      );
    }

    if (sort === 'price_asc')  return [...pool].sort((a, b) => a.price_pkr - b.price_pkr);
    if (sort === 'price_desc') return [...pool].sort((a, b) => b.price_pkr - a.price_pkr);
    return pool; // newest: already ordered by created_at DESC from DB
  }, [listings, query, condition, city, sort]);

  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => {
      trackEvent('marketplace_search', { query_length: query.length, result_count: filtered.length });
    }, 800);
    return () => clearTimeout(t);
  }, [query, filtered.length]);

  return (
    <>
      <Head>
        <title>Fragrance Marketplace Pakistan | PakFrag</title>
        <meta name="description" content="Buy and sell fragrances in Pakistan. Browse sealed bottles, decants, and partial bottles from verified PakFrag sellers." />
        <link rel="canonical" href="https://pakfrag.com/marketplace" />
        <meta property="og:title" content="Fragrance Marketplace Pakistan | PakFrag" />
        <meta property="og:description" content="Buy and sell fragrances from verified sellers across Pakistan." />
        <meta property="og:url" content="https://pakfrag.com/marketplace" />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-20 sm:py-28">

          {/* Breadcrumb */}
          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Marketplace</span>
          </nav>

          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7] leading-tight">
                Marketplace
              </h1>
              <p className="mt-3 text-base text-gray-400 max-w-lg">
                Fragrances listed by verified PakFrag sellers. Contact via WhatsApp to complete your purchase.
              </p>
            </div>
            <Link
              href="/sell"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              + Post a Listing
            </Link>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-white/25 transition flex-1 min-w-48">
              <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fragrance, brand, seller…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            {/* Condition pills */}
            <div className="flex gap-1.5 flex-wrap">
              {['ALL', 'sealed', 'partial', 'decant', 'gift_set'].map(c => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    condition === c
                      ? 'bg-white text-black'
                      : 'border border-white/15 text-gray-300 hover:border-white/30 hover:text-white',
                  ].join(' ')}
                >
                  {c === 'ALL' ? 'All' : CONDITION_LABEL[c]?.label || c}
                </button>
              ))}
            </div>

            {/* City */}
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
            >
              {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-500 mb-5">
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            {lastUpdated && <span className="ml-2">· Updated {new Date(lastUpdated).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] py-20 text-center">
              <p className="text-gray-400 font-medium">No listings found</p>
              <p className="text-sm text-gray-600 mt-1">Try adjusting your filters, or be the first to post one.</p>
              <Link href="/sell" className="inline-block mt-5 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:border-white/30 transition">
                + Post a listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          {/* CTA for sellers */}
          <div className="mt-16 rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-gray-400 mb-1">Are you a verified seller?</p>
            <h2 className="text-xl font-bold text-white mb-4">List your fragrances here — it&apos;s free.</h2>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              + Post a Listing
            </Link>
            <p className="mt-3 text-xs text-gray-600">
              Only verified sellers can post.{' '}
              <Link href="/tools/verify-seller" className="text-gray-400 hover:text-white underline underline-offset-2 transition">
                Check the registry
              </Link>
            </p>
          </div>

        </main>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps() {
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      id, fragrance_name, house, concentration, condition,
      fill_level_pct, price_pkr, is_negotiable, city,
      images, expires_at, created_at,
      sellers!inner(id, name, code, slug, verification_tier)
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  return {
    props: {
      listings: listings || [],
      lastUpdated: new Date().toISOString(),
    },
    revalidate: 120, // refresh every 2 min — listings change more frequently than sellers
  };
}
