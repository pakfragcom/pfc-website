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

// --------------------------- UI PARTS ---------------------------
const VerifiedBadge = ({ size = 22 }) => (
  <span
    className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
    style={{ width: size, height: size }}
    aria-label="Approved"
    title="Approved"
  >
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.7} height={size * 0.7}>
      <path
        d="M12 2l2.4 2.2 3.2-.6.6 3.2L20.8 9 23 12l-2.2 3 .4 3.4-3.4.4L14.4 22 12 19.8 9.6 22l-3.4-.4L6.6 15 4 12l2.2-3L5.8 5.6l3.2.6L12 2z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M9 12.5l2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const LuxuryCard = ({ item, onClick, idx }) => {
  const inner = (
    <div className="relative rounded-2xl p-[1px] overflow-hidden min-h-[140px] sm:min-h-[160px] flex">
      <div
        className="absolute inset-0 opacity-40 blur-xl pointer-events-none animate-spin-slower"
        style={{
          background: "conic-gradient(from 0deg, rgba(16,185,129,0.25), rgba(59,130,246,0.25), rgba(16,185,129,0.25))",
        }}
      />
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0b0f15]/80 via-[#0b0f15]/70 to-[#0b0f15]/60 ring-1 ring-white/10 backdrop-blur-md flex flex-col justify-between w-full">
        <div className="relative p-4 sm:p-5 flex-1 flex flex-col items-center justify-center text-center">
          <VerifiedBadge />
          <div className="font-extrabold text-base sm:text-lg leading-snug line-clamp-2 mt-2">
            {item.house}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-emerald-200/90 italic line-clamp-2">
            By {item.by}
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500"
          style={{
            background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          }}
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

const FeaturedSpotlight = ({ data }) => {
  const [batch, setBatch] = useState(() => pickRandomUnique(data, 4));

  useEffect(() => {
    const interval = setInterval(() => {
      setBatch(pickRandomUnique(data, 4));
    }, 7000);
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300 text-xs font-medium">
          <VerifiedBadge size={14} />
          Featured Spotlight
        </div>
        <div className="text-[11px] sm:text-xs text-gray-400">
          Rotates every 7s &bull; Random 4 Houses
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={batch.map((b) => b.house).join("|")}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          {batch.map((item, idx) => (
            <LuxuryCard key={item.house} item={item} idx={idx} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --------------------------- PAGE -------------------------------
export default function ApprovedHousesPage({ houses = [] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

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
        description={`Discover ${houses.length}+ PFC-verified Pakistani fragrance houses. Browse local brands, read community reviews, and find your next signature scent from Pakistan's fragrance community.`}
      />
      <Header />

      <div className="min-h-screen text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300 text-xs font-medium">
              <VerifiedBadge size={14} />
              PFC-MFP Approved Houses
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Explore the Curated House Directory
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-300/90">
              Type a <span className="font-semibold">house name</span> to search, or enjoy the{" "}
              <span className="font-semibold text-emerald-300/90">Featured Spotlight</span>.
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

              {/* Featured Spotlight when empty */}
              {!query && houses.length > 0 && <FeaturedSpotlight data={houses} />}

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
    .select("house, director, slug")
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
  }));

  return {
    props: { houses: mapped },
    revalidate: 300, // ISR: refresh every 5 minutes
  };
}
