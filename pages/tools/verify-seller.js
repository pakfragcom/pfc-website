// pages/tools/verify-seller.js
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { trackEvent } from "../../lib/analytics";
import { supabase } from "../../lib/supabase";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

/**
 * VERIFIED SELLER PORTAL CHECK (Search-Only)
 * - Data fetched from Supabase via getStaticProps (ISR every 5 min)
 * - BNIB pass includes decant selling (explicitly shown in UI)
 * - Search by name OR verification code (fuzzy)
 * - Shows suggestions ONLY when typing; no full list rendering
 * - After selecting, shows a verified card
 */

const TIER_CONFIG = {
  0: { label: 'Unverified',         cls: 'border-white/10 bg-white/5 text-gray-400' },
  1: { label: 'Community Verified', cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' },
  2: { label: 'Document Verified',  cls: 'border-sky-500/25 bg-sky-500/10 text-sky-300' },
  3: { label: 'PakFrag Trusted',    cls: 'border-amber-500/25 bg-amber-500/10 text-amber-300' },
};

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
  const name = normalize(item.name);
  const code = normalize(item.code);
  if (!q) return 9999;
  if (name.includes(q) || code.includes(q)) return 0;
  const tokens = q.split(" ").filter(Boolean);
  const tokenHits = tokens.reduce(
    (acc, t) => acc + (name.includes(t) || code.includes(t) ? 1 : 0), 0
  );
  const tokenScore = tokens.length ? (tokens.length - tokenHits) * 0.75 : 2;
  const editScore = Math.min(levenshtein(q, name.slice(0, q.length)), levenshtein(q, code));
  return tokenScore + editScore / 3;
}

function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text); } catch {}
}

// --------------------------- UI PARTS ---------------------------
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0 text-gray-400" aria-hidden="true">
    <path d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
    <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" opacity="0.6" />
  </svg>
);

// --------------------------- PAGE -------------------------------
export default function VerifySellerPage({ sellers = [] }) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);

  const filteredDirectory = useMemo(() => {
    const pool = activeType === "ALL" ? sellers : sellers.filter((s) => s.type === activeType);
    if (!query) return [];
    return pool
      .map((item) => ({ item, score: fuzzyRank(query, item) }))
      .filter((x) => x.score < 6.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 25)
      .map((x) => x.item);
  }, [query, activeType, sellers]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(null), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => {
      trackEvent("seller_search", {
        query_length: query.length,
        result_count: filteredDirectory.length,
        seller_type: activeType,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [query, filteredDirectory.length, activeType]);

  const handlePick = (item) => {
    setSelected(item);
    setQuery("");
    trackEvent("seller_verified", { seller_type: item.type });
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-black text-white font-sans">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-20 sm:py-28">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-gray-500">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Verify Seller</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-5">
            <CheckIcon />
            PFC Verified Seller Registry
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F7] leading-tight">
            Verify a Seller
          </h1>
          <p className="mt-4 text-base text-gray-400 max-w-lg">
            Search by name or verification code. BNIB status includes decanting privileges.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: "ALL", label: "All Sellers" },
            { id: "BNIB", label: "BNIB" },
            { id: "DECANT", label: "Decanters" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveType(id)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                activeType === id
                  ? "bg-white text-black"
                  : "border border-white/15 text-gray-300 hover:border-white/30 hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-white/30 focus-within:bg-white/8 transition">
            <SearchIcon />
            <label htmlFor="sellerSearch" className="sr-only">Search by name or code</label>
            <input
              ref={inputRef}
              id="sellerSearch"
              type="text"
              placeholder="Name or code (e.g. Zakir or SM-222)"
              className="w-full bg-transparent text-base text-white placeholder-gray-500 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button
                onClick={handleClear}
                className="shrink-0 text-gray-500 hover:text-white transition text-xs"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {query && filteredDirectory.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-10 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
              {filteredDirectory.map((item) => (
                <button
                  key={item.type + item.code}
                  onClick={() => handlePick(item)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition first:rounded-t-2xl last:rounded-b-2xl group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                      <CheckIcon />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-[#F5F5F7]">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.type === "BNIB" ? "BNIB — includes Decanting" : "Decanter / Vial Seller"}
                      </div>
                    </div>
                  </div>
                  <span className="ml-4 shrink-0 font-mono text-xs text-gray-400 group-hover:text-gray-200 transition">
                    {item.code}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query && filteredDirectory.length === 0 && (
            <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
              <p className="text-sm font-semibold text-amber-300">Not found</p>
              <p className="mt-1 text-sm text-amber-200/70">
                This name or code isn&apos;t in our registry. Try a shorter query or search by
                code directly (e.g. <span className="font-mono">AA-123X</span>).
              </p>
            </div>
          )}
        </div>

        {/* Selected result */}
        {selected && (
          <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <CheckIcon />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-1">
                  Verified
                </p>
                <h2 className="text-2xl font-bold text-[#F5F5F7] truncate">{selected.name}</h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                    <span className="font-mono text-[#F5F5F7]">{selected.code}</span>
                    <button
                      onClick={() => { copyToClipboard(selected.code); setCopied(selected.code); }}
                      className="text-gray-400 hover:text-white transition"
                      title="Copy code"
                      aria-label="Copy verification code"
                    >
                      {copied === selected.code
                        ? <span className="text-xs text-emerald-400">Copied</span>
                        : <CopyIcon />
                      }
                    </button>
                  </span>

                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
                    {selected.type === "BNIB" ? "BNIB — includes Decanting" : "Decanter / Vial Seller"}
                  </span>

                  {selected.tier > 0 && (
                    <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${(TIER_CONFIG[selected.tier] || TIER_CONFIG[0]).cls}`}>
                      {(TIER_CONFIG[selected.tier] || TIER_CONFIG[0]).label}
                    </span>
                  )}
                </div>

                {selected.type === "BNIB" && (
                  <p className="mt-4 text-sm text-gray-400">
                    BNIB status automatically grants decant selling privileges.
                  </p>
                )}

                {selected.slug && (
                  <div className="mt-5">
                    <Link
                      href={`/sellers/${selected.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-white transition"
                    >
                      View Full Profile
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-12 text-xs text-gray-600 text-center">
          Last updated {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          &nbsp;&mdash;&nbsp;For corrections, contact PFC admins via the{" "}
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 transition underline underline-offset-2"
          >
            Facebook group
          </a>.
        </p>

      </main>

      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  const { data: sellers, error } = await supabase
    .from("sellers")
    .select("name, code, seller_type, slug, verification_tier")
    .in("status", ["active", "grace"])
    .order("name");

  if (error) {
    console.error("[verify-seller] Supabase fetch error:", error.message);
  }

  // Map seller_type → type so existing component logic works unchanged
  const mapped = (sellers || []).map((s) => ({
    name: s.name,
    code: s.code,
    type: s.seller_type,
    slug: s.slug || null,
    tier: s.verification_tier ?? 0,
  }));

  return {
    props: { sellers: mapped },
    revalidate: 60,
  };
}
