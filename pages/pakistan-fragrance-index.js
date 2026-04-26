import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Trend arrow + label
function Trend({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-gray-600 text-xs">—</span>;
  const abs = Math.abs(pct);
  if (abs < 2) return <span className="text-gray-500 text-xs">→ Stable</span>;
  if (pct > 0) return <span className="text-red-400 text-xs font-medium">↑ {abs}%</span>;
  return <span className="text-emerald-400 text-xs font-medium">↓ {abs}%</span>;
}

const SORT_OPTIONS = [
  { id: 'volume',     label: 'Most traded' },
  { id: 'price_asc',  label: 'Cheapest first' },
  { id: 'price_desc', label: 'Most expensive' },
  { id: 'trending',   label: 'Trending ↑' },
  { id: 'cooling',    label: 'Cooling ↓' },
];

export default function PakistanFragranceIndex({ entries = [], cityDemand = [], updatedAt }) {
  const [sort, setSort]   = useState('volume');
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    let pool = entries;

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      pool = pool.filter(e =>
        e.fragrance_name.toLowerCase().includes(q) ||
        e.house.toLowerCase().includes(q)
      );
    }

    if (sort === 'volume')     return [...pool].sort((a, b) => b.transaction_count - a.transaction_count);
    if (sort === 'price_asc')  return [...pool].sort((a, b) => a.avg_price_pkr - b.avg_price_pkr);
    if (sort === 'price_desc') return [...pool].sort((a, b) => b.avg_price_pkr - a.avg_price_pkr);
    if (sort === 'trending')   return [...pool].filter(e => e.trend_pct > 2).sort((a, b) => b.trend_pct - a.trend_pct);
    if (sort === 'cooling')    return [...pool].filter(e => e.trend_pct < -2).sort((a, b) => a.trend_pct - b.trend_pct);
    return pool;
  }, [entries, sort, query]);

  const topByVolume    = [...entries].sort((a, b) => b.transaction_count - a.transaction_count).slice(0, 3);
  const trending       = [...entries].filter(e => e.trend_pct > 5).sort((a, b) => b.trend_pct - a.trend_pct).slice(0, 3);
  const cooling        = [...entries].filter(e => e.trend_pct < -5).sort((a, b) => a.trend_pct - b.trend_pct).slice(0, 3);

  const description = 'Pakistan Fragrance Price Index — real transaction data from the PakFrag community. Track average prices, trends, and trade volumes for fragrances across Pakistan.';

  return (
    <>
      <Head>
        <title>Pakistan Fragrance Price Index | PakFrag</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://pakfrag.com/pakistan-fragrance-index" />
        <meta property="og:title" content="Pakistan Fragrance Price Index | PakFrag" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://pakfrag.com/pakistan-fragrance-index" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Pakistan Fragrance Price Index',
          description,
          url: 'https://pakfrag.com/pakistan-fragrance-index',
          creator: { '@type': 'Organization', name: 'PakFrag', url: 'https://pakfrag.com' },
          dateModified: updatedAt,
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-5xl px-4 py-20 sm:py-28">

          {/* Breadcrumb */}
          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Pakistan Fragrance Index</span>
          </nav>

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2a5c4f]/40 bg-[#2a5c4f]/10 px-3 py-1 text-xs font-medium text-[#94aea7] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Community Price Data
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7] leading-tight">
              Pakistan Fragrance<br />Price Index
            </h1>
            <p className="mt-4 text-base text-gray-400 max-w-xl">
              Real transaction prices from the PakFrag community. No guessing — actual deals, logged by buyers and sellers across Pakistan.
            </p>
            {updatedAt && (
              <p className="mt-2 text-xs text-gray-600">
                Updated {new Date(updatedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Spotlight cards */}
          {entries.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-4 mb-14">
              {/* Most traded */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Most Traded</p>
                <div className="space-y-2">
                  {topByVolume.map((e, i) => (
                    <div key={e.fragrance_name + e.house} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{e.fragrance_name}</p>
                        <p className="text-[10px] text-gray-600 truncate">{e.house}</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{e.transaction_count} deals</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending up */}
              <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5">
                <p className="text-[10px] uppercase tracking-wider text-red-400/70 mb-3">Trending ↑ Price Rising</p>
                {trending.length === 0 ? (
                  <p className="text-xs text-gray-600">Not enough data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {trending.map(e => (
                      <div key={e.fragrance_name + e.house} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{e.fragrance_name}</p>
                          <p className="text-[10px] text-gray-600 truncate">{e.house}</p>
                        </div>
                        <span className="shrink-0 text-xs text-red-400">+{e.trend_pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cooling down */}
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-3">Cooling ↓ Price Falling</p>
                {cooling.length === 0 ? (
                  <p className="text-xs text-gray-600">Not enough data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {cooling.map(e => (
                      <div key={e.fragrance_name + e.house} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{e.fragrance_name}</p>
                          <p className="text-[10px] text-gray-600 truncate">{e.house}</p>
                        </div>
                        <span className="shrink-0 text-xs text-emerald-400">{e.trend_pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search + sort */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-white/25 transition flex-1 min-w-48">
              <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fragrance or brand…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          {/* Table */}
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] py-24 text-center">
              <p className="text-gray-400 font-medium mb-2">No price data yet</p>
              <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
                The index builds automatically as community members log transactions.
              </p>
              <Link
                href="/log-transaction"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
              >
                Log the first transaction →
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/8 overflow-hidden">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-white/[0.03] border-b border-white/8 text-[10px] uppercase tracking-wider text-gray-500">
                  <span>Fragrance</span>
                  <span className="text-right">Avg Price</span>
                  <span className="text-right">Min</span>
                  <span className="text-right">Max</span>
                  <span className="text-right">30d Trend</span>
                  <span className="text-right">Deals</span>
                </div>

                {sorted.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</div>
                ) : (
                  sorted.map((entry, i) => (
                    <div
                      key={entry.fragrance_name + entry.house + i}
                      className="grid grid-cols-[2fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition items-center"
                    >
                      {/* Name */}
                      <div className="min-w-0">
                        {entry.slug ? (
                          <Link href={`/fragrances/${entry.slug}`} className="text-sm font-medium text-white hover:text-[#94aea7] transition truncate block">
                            {entry.fragrance_name}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-white truncate">{entry.fragrance_name}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{entry.house}</p>
                      </div>

                      {/* Avg */}
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">Rs {Number(entry.avg_price_pkr).toLocaleString()}</span>
                      </div>

                      {/* Min */}
                      <div className="hidden sm:block text-right">
                        <span className="text-xs text-gray-400">Rs {Number(entry.min_price_pkr).toLocaleString()}</span>
                      </div>

                      {/* Max */}
                      <div className="hidden sm:block text-right">
                        <span className="text-xs text-gray-400">Rs {Number(entry.max_price_pkr).toLocaleString()}</span>
                      </div>

                      {/* Trend */}
                      <div className="hidden sm:block text-right">
                        <Trend pct={entry.trend_pct} />
                      </div>

                      {/* Deals */}
                      <div className="hidden sm:block text-right">
                        <span className="text-xs text-gray-500">{entry.transaction_count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-4 text-xs text-gray-600 text-center">
                Showing {sorted.length} of {entries.length} fragrances with logged transactions
              </p>
            </>
          )}

          {/* City Demand */}
          {cityDemand.length > 0 && (
            <div className="mt-14">
              <h2 className="text-lg font-bold text-white mb-1">Activity by City</h2>
              <p className="text-xs text-gray-500 mb-5">Where Pakistan&apos;s fragrance deals are happening</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {cityDemand.map((c, i) => {
                  const max = cityDemand[0].transaction_count;
                  const pct = Math.round((c.transaction_count / max) * 100);
                  return (
                    <div key={c.city} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">{c.city}</p>
                        <span className="text-[10px] text-gray-600">#{i + 1}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 mb-2">
                        <div className="h-full rounded-full bg-[#557d72]" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs font-bold text-white">{c.transaction_count} deals</p>
                      {c.avg_price_pkr && (
                        <p className="text-[10px] text-gray-500 mt-0.5">avg Rs {c.avg_price_pkr.toLocaleString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Help build this index</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Every deal you log makes this data more accurate. It takes 30 seconds.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/log-transaction"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
              >
                Log a Transaction
              </Link>
              <Link
                href="/tools/verify-seller"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition"
              >
                Verify a Seller
              </Link>
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps() {
  const { data: rows } = await supabase
    .from('fragrance_price_stats')
    .select('fragrance_name, house, transaction_count, success_count, avg_price_pkr, min_price_pkr, max_price_pkr, avg_price_30d, avg_price_prev_30d, last_transaction_at')
    .order('transaction_count', { ascending: false })
    .limit(500);

  // Try to join with fragrances table to get slugs
  const { data: fragrances } = await supabase
    .from('fragrances')
    .select('name, house, slug')
    .eq('status', 'approved');

  const slugMap = new Map();
  (fragrances || []).forEach(f => {
    slugMap.set(`${f.name.toLowerCase().trim()}|${f.house.toLowerCase().trim()}`, f.slug);
  });

  const entries = (rows || []).map(r => {
    const key = `${r.fragrance_name.toLowerCase().trim()}|${r.house.toLowerCase().trim()}`;
    const trend_pct = r.avg_price_30d && r.avg_price_prev_30d && r.avg_price_prev_30d > 0
      ? Math.round(((r.avg_price_30d - r.avg_price_prev_30d) / r.avg_price_prev_30d) * 100)
      : null;
    return {
      fragrance_name:    r.fragrance_name,
      house:             r.house,
      transaction_count: r.transaction_count,
      success_count:     r.success_count,
      avg_price_pkr:     r.avg_price_pkr,
      min_price_pkr:     r.min_price_pkr,
      max_price_pkr:     r.max_price_pkr,
      trend_pct,
      last_transaction_at: r.last_transaction_at,
      slug: slugMap.get(key) || null,
    };
  });

  // City demand data
  const { data: cityRows } = await supabase
    .from('city_transaction_demand')
    .select('city, transaction_count, seller_count, avg_price_pkr')
    .limit(10);

  const cityDemand = (cityRows || []).map(r => ({
    city:              r.city,
    transaction_count: r.transaction_count,
    seller_count:      r.seller_count,
    avg_price_pkr:     r.avg_price_pkr ? Math.round(r.avg_price_pkr) : null,
  }));

  return {
    props: {
      entries,
      cityDemand,
      updatedAt: new Date().toISOString(),
    },
    revalidate: 3600, // hourly — price data doesn't need minute-level freshness
  };
}
