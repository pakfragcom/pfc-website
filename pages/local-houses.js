// pages/local-houses.js
import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const normalize = (s) =>
  (s || '').toString().trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

function levenshtein(a, b) {
  a = normalize(a); b = normalize(b);
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  return dp[m][n];
}

function fuzzyRank(query, item) {
  const q = normalize(query);
  const h = normalize(item.house);
  const by = normalize(item.by);
  if (!q) return 9999;
  if (h.includes(q)) return 0;
  const tokens = q.split(' ').filter(Boolean);
  const tokenHits = tokens.reduce((acc, t) => acc + (h.includes(t) || by.includes(t) ? 1 : 0), 0);
  const tokenScore = tokens.length ? (tokens.length - tokenHits) * 0.75 : 2;
  const editScore = Math.min(levenshtein(q, h.slice(0, q.length)), Math.max(0, levenshtein(q, by) - 2));
  return tokenScore + editScore / 3;
}

// Deterministic accent color from house name
const ACCENTS = [
  '#2a5c4f', '#3d6b5e', '#1e4d40', '#4a7c6f',
  '#5c4a2a', '#6b5e3d', '#4d3d1e', '#7c6f4a',
  '#2a3d5c', '#3d4a6b', '#1e2d4d', '#4a5e7c',
  '#5c2a3d', '#6b3d4a', '#4d1e2d', '#7c4a5e',
];

function accentColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function initials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// ─── TIER HEADER ─────────────────────────────────────────────────────────────

function TierHeader({ tier, count }) {
  const cfg = TIER_CFG[tier];
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${cfg.badge}`}>
        {cfg.icon} {cfg.label}
      </span>
      <div className={`flex-1 h-px ${cfg.line}`} />
      <span className={`text-xs font-medium ${cfg.countColor}`}>{count}</span>
    </div>
  );
}

const TIER_CFG = {
  platinum: {
    label: 'Platinum',
    icon: '♛',
    badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    line: 'bg-gradient-to-r from-amber-500/40 to-transparent',
    countColor: 'text-amber-400/60',
    border: 'border-amber-500/20 hover:border-amber-400/40',
    shimmer: 'from-amber-400/30 to-transparent',
    logo: 'bg-amber-500/10',
  },
  gold: {
    label: 'Gold',
    icon: '✦',
    badge: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
    line: 'bg-gradient-to-r from-yellow-500/30 to-transparent',
    countColor: 'text-yellow-400/60',
    border: 'border-yellow-500/15 hover:border-yellow-400/35',
    shimmer: 'from-yellow-400/20 to-transparent',
    logo: 'bg-yellow-500/10',
  },
  silver: {
    label: 'Silver',
    icon: '◈',
    badge: 'bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20',
    line: 'bg-gradient-to-r from-slate-400/30 to-transparent',
    countColor: 'text-slate-400/60',
    border: 'border-slate-400/15 hover:border-slate-300/30',
    shimmer: 'from-slate-300/15 to-transparent',
    logo: 'bg-slate-500/10',
  },
};

// ─── CARD COMPONENTS ─────────────────────────────────────────────────────────

function PlatinumCard({ item }) {
  const cfg = TIER_CFG.platinum;
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group relative block rounded-[20px] border bg-white/[0.03] overflow-hidden transition-all duration-300 ${cfg.border}`}
      >
        {/* Top shimmer line */}
        <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${cfg.shimmer}`} />

        {/* Hover arrow */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-4 h-4 text-amber-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </div>

        <div className="p-5">
          {/* Logo mark */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: accent + '33', border: `1px solid ${accent}55` }}
          >
            <span style={{ color: accent + 'ee' }}>{initials(item.house)}</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-amber-100 transition-colors">
            {item.house}
          </h3>

          {/* Tagline / director */}
          {item.by && item.by !== '—' && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{item.by}</p>
          )}

          {/* Meta row */}
          {item.city && (
            <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {item.city}
            </div>
          )}
        </div>
      </CardWrapper>
    </m.div>
  );
}

function GoldCard({ item }) {
  const cfg = TIER_CFG.gold;
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group relative block rounded-2xl border bg-white/[0.025] overflow-hidden transition-all duration-300 ${cfg.border}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${cfg.shimmer}`} />
        <div className="p-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 flex-shrink-0 font-semibold text-base"
            style={{ backgroundColor: accent + '2a', border: `1px solid ${accent}44` }}
          >
            <span style={{ color: accent + 'dd' }}>{initials(item.house)}</span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-yellow-100 transition-colors">
            {item.house}
          </h3>
          {item.city && (
            <p className="text-[10px] text-gray-600 mt-1">{item.city}</p>
          )}
        </div>
      </CardWrapper>
    </m.div>
  );
}

function SilverCard({ item }) {
  const cfg = TIER_CFG.silver;
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group relative block rounded-[14px] border bg-white/[0.02] overflow-hidden transition-all duration-300 ${cfg.border} p-3`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold"
            style={{ backgroundColor: accent + '22', border: `1px solid ${accent}33` }}
          >
            <span style={{ color: accent + 'cc' }}>{initials(item.house)}</span>
          </div>
          <h3 className="font-medium text-white text-xs leading-snug line-clamp-2 group-hover:text-slate-100 transition-colors">
            {item.house}
          </h3>
        </div>
      </CardWrapper>
    </m.div>
  );
}

// Search result card — generic across tiers
function SearchCard({ item }) {
  const cfg = TIER_CFG[item.tier] || TIER_CFG.silver;
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group relative block rounded-2xl border bg-white/[0.03] overflow-hidden transition-all duration-300 ${cfg.border} p-4`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold"
            style={{ backgroundColor: accent + '2a', border: `1px solid ${accent}44` }}
          >
            <span style={{ color: accent + 'dd' }}>{initials(item.house)}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm line-clamp-1">{item.house}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
              {item.city && <span className="text-[10px] text-gray-500">{item.city}</span>}
            </div>
          </div>
        </div>
      </CardWrapper>
    </m.div>
  );
}

// ─── AD BANNER ───────────────────────────────────────────────────────────────

function AdBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-5 mb-12 flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Sponsored</p>
        <p className="text-sm text-gray-500">Advertisement space available — contact PFC admins.</p>
      </div>
      <div className="flex-shrink-0 text-gray-700 text-xs hidden sm:block">Ad</div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LocalHousesPage({ houses = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const platinum = useMemo(() => houses.filter(h => h.tier === 'platinum'), [houses]);
  const gold     = useMemo(() => houses.filter(h => h.tier === 'gold'),     [houses]);
  const silver   = useMemo(() => houses.filter(h => h.tier === 'silver'),   [houses]);

  const filtered = useMemo(() => {
    if (!query) return [];
    return houses
      .map(item => ({ item, score: fuzzyRank(query, item) }))
      .filter(x => x.score < 6.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 30)
      .map(x => x.item);
  }, [query, houses]);

  const isSearching = query.trim().length > 0;

  return (
    <>
      <Head>
        <title>Pakistani Fragrance Houses | PFC</title>
        <meta name="description" content={`Discover ${houses.length}+ PFC-verified Pakistani fragrance houses — Platinum, Gold & Silver tiers. Browse local brands and find your next signature scent.`} />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">

            {/* ── Hero ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-white/10 mb-12">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-72 w-[700px] rounded-full bg-[#2a5c4f]/10 blur-3xl" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />
              </div>

              <div className="mx-auto max-w-5xl px-6 py-16 text-center relative">
                <m.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="inline-block mb-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400 backdrop-blur"
                >
                  PFC-Verified Directory
                </m.span>

                <m.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE, delay: 0.07 }}
                  className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl"
                >
                  Local
                  <span className="block bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent mt-1">
                    Houses
                  </span>
                </m.h1>

                <m.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
                  className="mt-4 text-gray-400 max-w-lg mx-auto text-sm sm:text-base"
                >
                  Pakistan&apos;s most complete directory of home-grown fragrance houses, verified and tiered by the PFC community.
                </m.p>

                {/* Stats row */}
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.21 }}
                  className="mt-8 flex flex-wrap justify-center gap-6"
                >
                  {[
                    { label: 'Total Houses', value: houses.length, color: 'text-white' },
                    { label: 'Platinum', value: platinum.length, color: 'text-amber-300' },
                    { label: 'Gold', value: gold.length, color: 'text-yellow-400' },
                    { label: 'Silver', value: silver.length, color: 'text-slate-300' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[11px] text-gray-600 uppercase tracking-wider mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </m.div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl px-6">

              {/* ── Search ───────────────────────────────────────────── */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
                className="mb-10"
              >
                <div className="relative max-w-xl mx-auto">
                  <label htmlFor="houseSearch" className="sr-only">Search fragrance houses</label>
                  <div className="flex items-center gap-3 bg-white/[0.04] ring-1 ring-white/10 rounded-2xl px-4 py-3 focus-within:ring-white/20 transition">
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                    </svg>
                    <input
                      ref={inputRef}
                      id="houseSearch"
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder='Search by house name or director…'
                      className="w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none text-sm"
                      autoComplete="off"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="text-gray-500 hover:text-white transition flex-shrink-0"
                        aria-label="Clear search"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </m.div>

              {/* ── Search Results ───────────────────────────────────── */}
              {isSearching && (
                <m.div
                  initial="hidden"
                  animate="show"
                  variants={staggerContainer}
                  className="mb-12"
                >
                  {filtered.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map(item => <SearchCard key={item.house} item={item} />)}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <p className="font-medium text-white mb-1">No results for &quot;{query}&quot;</p>
                      <p className="text-sm">Try a shorter name or check your spelling.</p>
                    </div>
                  )}
                </m.div>
              )}

              {/* ── Tier Grids (hidden while searching) ─────────────── */}
              {!isSearching && (
                <>
                  <AdBanner />

                  {/* Platinum */}
                  {platinum.length > 0 && (
                    <section className="mb-14">
                      <TierHeader tier="platinum" count={platinum.length} />
                      <m.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.05 }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      >
                        {platinum.map(item => <PlatinumCard key={item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}

                  {/* Gold */}
                  {gold.length > 0 && (
                    <section className="mb-14">
                      <TierHeader tier="gold" count={gold.length} />
                      <m.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.05 }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                      >
                        {gold.map(item => <GoldCard key={item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}

                  {/* Silver */}
                  {silver.length > 0 && (
                    <section className="mb-14">
                      <TierHeader tier="silver" count={silver.length} />
                      <m.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.05 }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5"
                      >
                        {silver.map(item => <SilverCard key={item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}
                </>
              )}

            </div>
          </main>
        </LazyMotion>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps() {
  const { data: houses, error } = await supabase
    .from('fragrance_houses')
    .select('house, director, slug, tier, city')
    .in('status', ['active', 'grace'])
    .order('house');

  if (error) console.error('[local-houses] Supabase fetch error:', error.message);

  const mapped = (houses || []).map(h => ({
    house: h.house,
    by: h.director?.trim() || '—',
    slug: h.slug || null,
    tier: h.tier || 'silver',
    city: h.city || null,
  }));

  return {
    props: { houses: mapped },
    revalidate: 300,
  };
}
