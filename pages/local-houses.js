// pages/local-houses.js
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import SEO from "../components/SEO";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { trackEvent } from "../lib/analytics";
import { supabase } from "../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

/**
 * PFC-MFP APPROVED HOUSES • Luxury Search + Featured Spotlight
 * - Data fetched from Supabase via getStaticProps (ISR every 5 min)
 * - Global search (fuzzy by house name; directors help ranking)
 * - Suggestions only while typing (no full list dump)
 * - Click to reveal a polished detail card (House + Creative Director)
 * - When search box is empty: a rotating Featured Spotlight grid
 */

// -------------------------- UTILITIES ---------------------------
const normalize = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fuzzyRank(query, item) {
  const q = normalize(query);
  const h = normalize(item.house);
  const by = normalize(item.by);

  if (!q) return 9999;
  if (h.includes(q)) return 0;

  const tokens = q.split(" ").filter(Boolean);
  const tokenHits = tokens.reduce(
    (acc, t) => acc + (h.includes(t) || by.includes(t) ? 1 : 0), 0
  );
  const tokenScore = tokens.length ? (tokens.length - tokenHits) * 0.75 : 2;
  const editScore = Math.min(
    levenshtein(q, h.slice(0, q.length)),
    Math.max(0, levenshtein(q, by) - 2)
  );
  return tokenScore + editScore / 3;
}

function pickRandomUnique(arr, count) {
  const copy = arr.slice();
  const out = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

// --------------------------- TIER CONFIG ---------------------------
const TIER = {
  platinum: {
    label: "The Platinum Club",
    icon: "♛",
    glow: "rgba(251,191,36,0.35), rgba(245,158,11,0.35), rgba(251,191,36,0.35)",
    ring: "ring-amber-500/35",
    badge: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
    border: "from-amber-400/20 to-yellow-600/10",
    desc: "PFC's highest-recognised houses — seniority, quality, and olfactory excellence.",
    headingClass: "text-amber-300",
    sectionBg: "bg-amber-500/5 ring-1 ring-amber-500/10",
  },
  gold: {
    label: "The Gold Club",
    icon: "✦",
    glow: "rgba(234,179,8,0.28), rgba(202,138,4,0.28), rgba(234,179,8,0.28)",
    ring: "ring-yellow-500/25",
    badge: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
    border: "from-yellow-400/15 to-amber-600/8",
    desc: "Strong brand recognition, reliable quality, and a defined house identity.",
    headingClass: "text-yellow-400",
    sectionBg: "bg-yellow-500/5 ring-1 ring-yellow-500/8",
  },
  silver: {
    label: "The Silver Club",
    icon: "◈",
    glow: "rgba(148,163,184,0.22), rgba(100,116,139,0.22), rgba(148,163,184,0.22)",
    ring: "ring-slate-400/20",
    badge: "bg-slate-500/10 text-slate-300 ring-1 ring-slate-400/20",
    border: "from-slate-300/10 to-slate-500/8",
    desc: "Promising newer houses showing real potential — ones to watch.",
    headingClass: "text-slate-300",
    sectionBg: "bg-slate-500/5 ring-1 ring-slate-400/8",
  },
};

// --------------------------- UI PARTS ---------------------------
const VerifiedBadge = ({ size = 22, tier = "platinum" }) => {
  const t = TIER[tier] || TIER.platinum;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${t.badge}`}
      style={{ width: size, height: size }}
      aria-label={t.label}
      title={t.label}
    >
      <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{t.icon}</span>
    </span>
  );
};

const LuxuryCard = ({ item, onClick, idx }) => {
  const tier = item.tier || "silver";
  const t = TIER[tier] || TIER.silver;

  const inner = (
    <div className={`relative rounded-2xl p-[1px] overflow-hidden min-h-[140px] sm:min-h-[160px] flex`}>
      <div
        className="absolute inset-0 opacity-35 blur-xl pointer-events-none animate-spin-slower"
        style={{ background: `conic-gradient(from 0deg, ${t.glow})` }}
      />
      <div className={`relative rounded-2xl bg-gradient-to-b from-[#0b0f15]/80 via-[#0b0f15]/70 to-[#0b0f15]/60 ${t.ring} ring-1 backdrop-blur-md flex flex-col justify-between w-full`}>
        <div className="relative p-4 sm:p-5 flex-1 flex flex-col items-center justify-center text-center">
          <VerifiedBadge tier={tier} />
          <div className="font-extrabold text-base sm:text-lg leading-snug line-clamp-2 mt-2">
            {item.house}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-emerald-200/80 italic line-clamp-2">
            By {item.by}
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500"
          style={{ background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)" }}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, delay: idx ? idx * 0.05 : 0, ease: "easeOut" }}
      className="relative group"
    >
      {item.slug ? (
        <Link href={`/houses/${item.slug}`} className="block cursor-pointer" onClick={onClick}>
          {inner}
        </Link>
      ) : (
        <div className="cursor-pointer" onClick={onClick}>{inner}</div>
      )}
    </motion.div>
  );
};

const TierSection = ({ tier, items }) => {
  const t = TIER[tier];
  if (!items?.length) return null;
  return (
    <div className={`rounded-2xl ${t.sectionBg} px-5 py-5 mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-2xl`}>{tier === 'platinum' ? '🏆' : tier === 'gold' ? '🥇' : '🥈'}</span>
        <div>
          <h2 className={`text-base font-bold ${t.headingClass}`}>{t.label}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${t.badge}`}>{items.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <LuxuryCard key={item.house} item={item} idx={idx} />
        ))}
      </div>
    </div>
  );
};

// --------------------------- PAGE -------------------------------
export default function ApprovedHousesPage({ houses = [] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const platinum = useMemo(() => houses.filter(h => h.tier === 'platinum'), [houses]);
  const gold     = useMemo(() => houses.filter(h => h.tier === 'gold'),     [houses]);
  const silver   = useMemo(() => houses.filter(h => h.tier === 'silver'),   [houses]);

  const filtered = useMemo(() => {
    if (!query) return [];
    return houses
      .map((item) => ({ item, score: fuzzyRank(query, item) }))
      .filter((x) => x.score < 6.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 30)
      .map((x) => x.item);
  }, [query, houses]);

  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => {
      trackEvent("house_search", {
        query_length: query.length,
        result_count: filtered.length,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [query, filtered.length]);

  const handlePick = (item) => {
    setSelected(item);
    setQuery(item.house);
  };

  return (
    <div className="bg-black text-white font-sans">
      <SEO
        title="Pakistani Fragrance Houses & Local Brands | PFC"
        description={`Discover ${houses.length}+ PFC-verified Pakistani fragrance houses — Platinum, Gold & Silver tiers. Browse local brands, read community reviews, and find your next signature scent.`}
      />
      <Header />

      <div className="min-h-screen text-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 ring-1 ring-amber-500/25 text-amber-300 text-xs font-medium">
              🏆 PFC-MBP Approved Houses
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Pakistan Fragrance House Directory
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-400">
              {houses.length} PFC-verified houses &nbsp;·&nbsp;
              <span className="text-amber-300">{platinum.length} Platinum</span>&nbsp;·&nbsp;
              <span className="text-yellow-400">{gold.length} Gold</span>&nbsp;·&nbsp;
              <span className="text-slate-300">{silver.length} Silver</span>
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white/5 backdrop-blur-sm ring-1 ring-white/10 rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-400/90">
                Search approved houses
              </div>
              <button
                onClick={() => {
                  setQuery("");
                  setSelected(null);
                  inputRef.current?.focus();
                }}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition"
                title="Clear search"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 relative">
              <label htmlFor="houseSearch" className="sr-only">
                Search by house name
              </label>

              <div className="flex items-center gap-2 bg-black/30 ring-1 ring-white/10 rounded-xl px-3 py-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-300/80">
                  <path d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  id="houseSearch"
                  placeholder='Type a house name (e.g., "Scent N Stories")'
                  className="w-full bg-transparent placeholder:text-gray-400/70 focus:outline-none text-base sm:text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Tier browse when empty */}
              {!query && houses.length > 0 && (
                <div className="mt-6">
                  <TierSection tier="platinum" items={platinum} />
                  <TierSection tier="gold" items={gold} />
                  <TierSection tier="silver" items={silver} />
                </div>
              )}

              {/* Suggestions */}
              {query && filtered.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-auto rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                  {filtered.map((item, idx) => (
                    <LuxuryCard
                      key={item.house}
                      item={item}
                      onClick={() => handlePick(item)}
                      idx={idx}
                    />
                  ))}
                </div>
              )}

              {/* No results */}
              {query && filtered.length === 0 && (
                <div className="mt-3 p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-200">
                  <div className="font-semibold">Not found</div>
                  <div className="text-sm opacity-90 mt-1">
                    This house isn&apos;t in our approved list. Check spelling or try a shorter part of the name.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected card */}
          {selected && (
            <div className="mt-6">
              <LuxuryCard item={selected} />
              {selected.slug && (
                <div className="mt-3 text-center">
                  <Link
                    href={`/houses/${selected.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 hover:brightness-110 transition"
                  >
                    View Profile &amp; Reviews →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-[11px] text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()} &bull; For corrections, contact PFC admins.
          </div>
        </div>
      </div>

      {/* Gradient spin animation */}
      <style jsx global>{`
        @keyframes spin-slower {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slower {
          animation: spin-slower 14s linear infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  const { data: houses, error } = await supabase
    .from("fragrance_houses")
    .select("house, director, slug, tier")
    .in("status", ["active", "grace"])
    .order("house");

  if (error) {
    console.error("[local-houses] Supabase fetch error:", error.message);
  }

  // Map to component field names
  const mapped = (houses || []).map((h) => ({
    house: h.house,
    by: h.director?.trim() || "\u2014",
    slug: h.slug || null,
    tier: h.tier || "silver",
  }));

  return {
    props: { houses: mapped },
    revalidate: 300, // ISR: refresh every 5 minutes
  };
}
