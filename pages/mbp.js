// pages/mbp.js
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
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

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

const ACCENTS = [
  '#2a5c4f','#3d6b5e','#1e4d40','#4a7c6f',
  '#5c4a2a','#6b5e3d','#4d3d1e','#7c6f4a',
  '#2a3d5c','#3d4a6b','#1e2d4d','#4a5e7c',
  '#5c2a3d','#6b3d4a','#4d1e2d','#7c4a5e',
];
function accentColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}
function initials(name) {
  const words = (name || '').trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── ANIMATION ───────────────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────

const TIER = {
  diamond: {
    label: 'Diamond', icon: '◆',
    desc: "Pakistan's most prestigious fragrance houses",
    badge: 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/30',
    border: 'border-sky-400/25 hover:border-sky-400/50',
    shimmer: 'from-sky-400/50 via-sky-300/20 to-transparent',
    line: 'bg-gradient-to-r from-sky-400/50 to-transparent',
    countColor: 'text-sky-400/60',
    glow: 'shadow-sky-500/10',
  },
  platinum: {
    label: 'Platinum', icon: '◈',
    desc: 'Premium certified fragrance houses',
    badge: 'bg-white/8 text-gray-200 ring-1 ring-white/20',
    border: 'border-white/15 hover:border-white/30',
    shimmer: 'from-white/30 via-white/10 to-transparent',
    line: 'bg-gradient-to-r from-white/40 to-transparent',
    countColor: 'text-gray-400/60',
    glow: 'shadow-white/5',
  },
  gold: {
    label: 'Gold', icon: '✦',
    desc: 'Established fragrance houses',
    badge: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25',
    border: 'border-amber-500/20 hover:border-amber-400/40',
    shimmer: 'from-amber-400/40 via-amber-300/15 to-transparent',
    line: 'bg-gradient-to-r from-amber-400/50 to-transparent',
    countColor: 'text-amber-400/60',
    glow: '',
  },
  emerging: {
    label: 'Emerging', icon: '★',
    desc: 'Rising Pakistani fragrance brands to watch',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    border: 'border-emerald-500/15 hover:border-emerald-400/30',
    shimmer: 'from-emerald-400/25 to-transparent',
    line: 'bg-gradient-to-r from-emerald-400/30 to-transparent',
    countColor: 'text-emerald-400/60',
    glow: '',
  },
};

// ─── SPONSOR CAROUSEL ────────────────────────────────────────────────────────

function SponsorCarousel({ sponsors }) {
  if (!sponsors?.length) return null;
  const items = [...sponsors, ...sponsors];
  return (
    <div className="border-y border-white/8 bg-white/[0.015] py-5 overflow-hidden">
      <p className="text-center text-[10px] uppercase tracking-[0.25em] text-gray-600 mb-4">Proud Partners</p>
      <div
        className="flex gap-5 w-max"
        style={{ animation: 'mbp-marquee 35s linear infinite' }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {items.map((s, i) => (
          <a
            key={i}
            href={s.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 ring-1 ring-white/10 hover:ring-white/25 hover:bg-white/8 transition-all flex-shrink-0 group"
          >
            {s.logo_url
              ? <img src={s.logo_url} alt={s.brand_name} className="h-5 w-auto object-contain opacity-70 group-hover:opacity-100 transition" />
              : <span className="text-sm font-medium text-gray-400 group-hover:text-white transition whitespace-nowrap">{s.brand_name}</span>
            }
            {s.tagline && <span className="text-[10px] text-gray-600 hidden sm:block">{s.tagline}</span>}
          </a>
        ))}
      </div>
      <style jsx>{`
        @keyframes mbp-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

function TierHeader({ tier, count }) {
  const cfg = TIER[tier];
  return (
    <div className="flex items-center gap-4 mb-7">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${cfg.badge}`}>
        {cfg.icon} {cfg.label}
      </span>
      <div className={`flex-1 h-px ${cfg.line}`} />
      <span className={`text-xs font-medium ${cfg.countColor} flex-shrink-0`}>{count}</span>
    </div>
  );
}

// ─── DIAMOND CARD (full-width) ────────────────────────────────────────────────

function DiamondCard({ item }) {
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <div className={`relative rounded-2xl border ${TIER.diamond.border} bg-white/[0.03] overflow-hidden group shadow-lg ${TIER.diamond.glow}`}>
        <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${TIER.diamond.shimmer}`} />
        <div className="flex flex-col sm:flex-row items-start gap-6 p-6 sm:p-8">

          {/* Logo */}
          <CardWrapper {...wrapperProps} className="flex-shrink-0 block">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-bold text-2xl overflow-hidden ring-1"
              style={{ backgroundColor: accent + '25', borderColor: accent + '50', ringColor: accent + '30' }}
            >
              {item.logo_url
                ? <img src={item.logo_url} alt={item.house} className="w-full h-full object-contain p-2" />
                : <span style={{ color: accent + 'ee' }} className="text-xl">{initials(item.house)}</span>
              }
            </div>
          </CardWrapper>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <CardWrapper {...wrapperProps} className="block">
                <h3 className="text-xl font-bold text-white group-hover:text-sky-200 transition leading-tight">{item.house}</h3>
              </CardWrapper>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${TIER.diamond.badge}`}>◆ Diamond</span>
            </div>

            {item.by && item.by !== '—' && (
              <p className="text-xs text-gray-500 mb-2">by {item.by}{item.city ? ` · ${item.city}` : ''}</p>
            )}

            {item.description ? (
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4 max-w-xl">{item.description}</p>
            ) : (
              <p className="text-sm text-gray-600 italic mb-4">Premier Pakistani fragrance house.</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-sm font-medium ring-1 ring-sky-500/30 transition"
                >
                  Visit Website ↗
                </a>
              )}
              {item.slug && (
                <Link href={`/houses/${item.slug}`} className="text-xs text-gray-600 hover:text-gray-400 transition">
                  View Profile →
                </Link>
              )}
              {item.fragrance_count > 0 && (
                <span className="text-xs text-gray-600">{item.fragrance_count} fragrances</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

// ─── PLATINUM CARD (3-col) ────────────────────────────────────────────────────

function PlatinumCard({ item }) {
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp} className="h-full">
      <CardWrapper
        {...wrapperProps}
        className={`group relative flex flex-col h-full rounded-[20px] border bg-white/[0.03] overflow-hidden transition-all duration-300 ${TIER.platinum.border}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${TIER.platinum.shimmer}`} />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 font-bold text-lg flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: accent + '28', border: `1px solid ${accent}45` }}
          >
            {item.logo_url
              ? <img src={item.logo_url} alt={item.house} className="w-full h-full object-contain p-1.5" />
              : <span style={{ color: accent + 'ee' }}>{initials(item.house)}</span>
            }
          </div>

          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-gray-100 transition mb-1">
            {item.house}
          </h3>
          {item.city && <p className="text-[11px] text-gray-500 mb-2">{item.city}</p>}
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-3">{item.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            {item.fragrance_count > 0
              ? <span className="text-[10px] text-gray-600">{item.fragrance_count} fragrances</span>
              : <span />
            }
            {item.website && (
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-gray-500 hover:text-white transition"
              >
                Website ↗
              </a>
            )}
          </div>
        </div>
      </CardWrapper>
    </m.div>
  );
}

// ─── GOLD CARD (4-col) ────────────────────────────────────────────────────────

function GoldCard({ item }) {
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group relative block rounded-xl border bg-white/[0.025] overflow-hidden transition-all duration-300 ${TIER.gold.border}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${TIER.gold.shimmer}`} />
        <div className="p-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 font-semibold text-base flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: accent + '22', border: `1px solid ${accent}38` }}
          >
            {item.logo_url
              ? <img src={item.logo_url} alt={item.house} className="w-full h-full object-contain p-1" />
              : <span style={{ color: accent + 'dd' }}>{initials(item.house)}</span>
            }
          </div>
          <h3 className="font-semibold text-white text-xs leading-snug line-clamp-2 group-hover:text-amber-100 transition mb-1">
            {item.house}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="text-[10px] text-gray-500 space-y-0.5">
              {item.city && <p>{item.city}</p>}
              {item.fragrance_count > 0 && <p className="text-gray-600">{item.fragrance_count} fragrances</p>}
            </div>
            {item.website && (
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[11px] text-gray-600 hover:text-amber-400 transition"
              >
                ↗
              </a>
            )}
          </div>
        </div>
      </CardWrapper>
    </m.div>
  );
}

// ─── EMERGING ROW (list) ─────────────────────────────────────────────────────

function EmergingRow({ item }) {
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group flex items-center gap-4 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-all duration-200 ${TIER.emerging.border}`}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold overflow-hidden"
          style={{ backgroundColor: accent + '18', border: `1px solid ${accent}28` }}
        >
          {item.logo_url
            ? <img src={item.logo_url} alt={item.house} className="w-full h-full object-contain p-0.5" />
            : <span style={{ color: accent + 'bb' }}>{initials(item.house)}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white group-hover:text-emerald-200 transition line-clamp-1">{item.house}</p>
          {item.city && <p className="text-[10px] text-gray-600 mt-0.5">{item.city}</p>}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {item.fragrance_count > 0 && (
            <span className="text-[10px] text-gray-600">{item.fragrance_count}</span>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-gray-600 hover:text-emerald-400 transition"
            >
              ↗
            </a>
          )}
        </div>
      </CardWrapper>
    </m.div>
  );
}

// ─── SEARCH RESULT CARD ──────────────────────────────────────────────────────

function SearchCard({ item }) {
  const cfg = TIER[item.tier] || TIER.emerging;
  const accent = accentColor(item.house);
  const CardWrapper = item.slug ? Link : 'div';
  const wrapperProps = item.slug ? { href: `/houses/${item.slug}` } : {};

  return (
    <m.div variants={fadeUp}>
      <CardWrapper
        {...wrapperProps}
        className={`group flex items-center gap-3 rounded-xl border bg-white/[0.03] hover:bg-white/[0.05] px-4 py-3 transition-all ${cfg.border}`}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm overflow-hidden"
          style={{ backgroundColor: accent + '22', border: `1px solid ${accent}44` }}
        >
          {item.logo_url
            ? <img src={item.logo_url} alt={item.house} className="w-full h-full object-contain p-1" />
            : <span style={{ color: accent + 'dd' }}>{initials(item.house)}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white line-clamp-1">{item.house}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.icon} {cfg.label}</span>
            {item.city && <span className="text-[10px] text-gray-500">{item.city}</span>}
            {item.fragrance_count > 0 && <span className="text-[10px] text-gray-600">{item.fragrance_count} fragrances</span>}
          </div>
        </div>
        {item.website && (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs text-gray-600 hover:text-white transition flex-shrink-0"
          >
            ↗
          </a>
        )}
      </CardWrapper>
    </m.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MBPPage({ houses = [], sponsors = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const diamond  = useMemo(() => houses.filter(h => h.tier === 'diamond'),  [houses]);
  const platinum = useMemo(() => houses.filter(h => h.tier === 'platinum'), [houses]);
  const gold     = useMemo(() => houses.filter(h => h.tier === 'gold'),     [houses]);
  const emerging = useMemo(() => houses.filter(h => h.tier === 'emerging'), [houses]);

  const totalCities = useMemo(() => new Set(houses.map(h => h.city).filter(Boolean)).size, [houses]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
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
        <title>Pakistan's Fragrance Brands | PFC</title>
        <meta name="description" content={`Discover ${houses.length}+ PFC-verified Pakistani fragrance brands — Diamond, Platinum, Gold & Emerging. The definitive showcase of local perfume houses.`} />
        <link rel="canonical" href="https://pakfrag.com/mbp" />
        <meta property="og:title" content="Pakistan's Fragrance Brands | PFC" />
        <meta property="og:description" content={`${houses.length}+ PFC-verified Pakistani fragrance brands. Diamond, Platinum, Gold & Emerging tiers.`} />
        <meta property="og:url" content="https://pakfrag.com/mbp" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://pakfrag.com/pfc-round.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pakfragcom" />
        <meta name="twitter:title" content="Pakistan's Fragrance Brands | PFC" />
        <meta name="twitter:description" content={`${houses.length}+ PFC-verified Pakistani fragrance brands.`} />
        <meta name="twitter:image" content="https://pakfrag.com/pfc-round.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pakfrag.com' },
            { '@type': 'ListItem', position: 2, name: "Pakistan's Fragrance Brands", item: 'https://pakfrag.com/mbp' },
          ],
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-white/8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 h-80 w-[900px] rounded-full bg-[#2a5c4f]/8 blur-3xl" />
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-500/4 blur-3xl" />
                <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-amber-500/4 blur-3xl" />
              </div>

              <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 relative">
                <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>

                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#94aea7] mb-5">PFC · Made in Pakistan</p>

                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                    Pakistan&apos;s<br />
                    <span className="bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent">
                      Fragrance Brands
                    </span>
                  </h1>

                  <p className="text-gray-400 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
                    The definitive showcase of PFC-verified local perfume houses — from established names to rising voices in Pakistani perfumery.
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-8 mb-10">
                    {[
                      { value: houses.length, label: 'Verified Brands', color: 'text-white' },
                      { value: totalCities,   label: 'Cities',          color: 'text-[#94aea7]' },
                      { value: diamond.length + platinum.length, label: 'Premium Partners', color: 'text-sky-300' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative max-w-sm">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                    </svg>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search brands…"
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/6 ring-1 ring-white/12 text-sm text-white placeholder-gray-500 outline-none focus:ring-white/22 transition"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                </m.div>
              </div>
            </div>

            {/* ── Sponsor Carousel ─────────────────────────────────────── */}
            <SponsorCarousel sponsors={sponsors} />

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 mt-14">

              {isSearching ? (
                /* Search results */
                <m.div initial="hidden" animate="show" variants={stagger}>
                  <p className="text-xs text-gray-500 mb-5">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;
                  </p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-white font-medium mb-1">No brands found</p>
                      <p className="text-sm text-gray-500">Try a different name or check spelling.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map(item => <SearchCard key={item.slug || item.house} item={item} />)}
                    </div>
                  )}
                </m.div>

              ) : (
                /* Tier sections */
                <m.div initial="hidden" animate="show" variants={stagger} className="space-y-16">

                  {/* Diamond */}
                  {diamond.length > 0 && (
                    <section>
                      <TierHeader tier="diamond" count={diamond.length} />
                      <div className="space-y-4">
                        {diamond.map(item => <DiamondCard key={item.slug || item.house} item={item} />)}
                      </div>
                    </section>
                  )}

                  {/* Platinum */}
                  {platinum.length > 0 && (
                    <section>
                      <TierHeader tier="platinum" count={platinum.length} />
                      <m.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        {platinum.map(item => <PlatinumCard key={item.slug || item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}

                  {/* Gold */}
                  {gold.length > 0 && (
                    <section>
                      <TierHeader tier="gold" count={gold.length} />
                      <m.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {gold.map(item => <GoldCard key={item.slug || item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}

                  {/* Emerging */}
                  {emerging.length > 0 && (
                    <section>
                      <TierHeader tier="emerging" count={emerging.length} />
                      <m.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {emerging.map(item => <EmergingRow key={item.slug || item.house} item={item} />)}
                      </m.div>
                    </section>
                  )}

                  {/* Get Listed CTA */}
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2">Want to be featured?</p>
                    <h3 className="text-xl font-bold text-white mb-2">List Your Fragrance Brand</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                      Join Pakistan&apos;s most trusted fragrance community. Diamond, Platinum &amp; Gold placements available quarterly.
                    </p>
                    <a
                      href="https://pakfrag.com/contact"
                      className="inline-flex items-center gap-2 bg-[#2a5c4f] hover:bg-[#3a7a6a] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                      Get in Touch
                    </a>
                  </div>

                </m.div>
              )}
            </div>
          </main>
        </LazyMotion>

        <Footer />
      </div>
    </>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

export async function getStaticProps() {
  const [{ data: houses, error }, { data: fragRows }, { data: sponsors }] = await Promise.all([
    supabase
      .from('fragrance_houses')
      .select('house, director, slug, tier, city, logo_url, website, description')
      .in('status', ['active', 'grace'])
      .order('house'),
    supabase
      .from('fragrances')
      .select('fragrance_houses(slug)')
      .eq('status', 'approved'),
    supabase
      .from('mbp_sponsors')
      .select('brand_name, logo_url, website_url, tagline')
      .eq('active', true)
      .order('sort_order'),
  ]);

  if (error) console.error('[mbp] Supabase fetch error:', error.message);

  const fragCountBySlug = {};
  (fragRows || []).forEach(f => {
    const slug = f.fragrance_houses?.slug;
    if (slug) fragCountBySlug[slug] = (fragCountBySlug[slug] || 0) + 1;
  });

  const mapped = (houses || []).map(h => ({
    house:           h.house,
    by:              h.director?.trim() || '—',
    slug:            h.slug || null,
    tier:            h.tier || 'emerging',
    city:            h.city || null,
    logo_url:        h.logo_url || null,
    website:         h.website || null,
    description:     h.description || null,
    fragrance_count: h.slug ? (fragCountBySlug[h.slug] || 0) : 0,
  }));

  return {
    props: {
      houses:   mapped,
      sponsors: sponsors || [],
    },
    revalidate: 3600,
  };
}
