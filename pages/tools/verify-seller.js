// pages/tools/verify-seller.js
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { trackEvent } from "../../lib/analytics";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

const TIER_CONFIG = {
  0: { label: 'Unverified',         cls: 'border-white/10 bg-white/5 text-gray-400' },
  1: { label: 'Community Verified', cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' },
  2: { label: 'Document Verified',  cls: 'border-sky-500/25 bg-sky-500/10 text-sky-300' },
  3: { label: 'PakFrag Trusted',    cls: 'border-amber-500/25 bg-amber-500/10 text-amber-300' },
};

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
export default function VerifySellerPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(null), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  // Debounced server-side search — seller list never sent to client
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), type: activeType });
        const res = await fetch(`/api/sellers/search?${params}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        trackEvent("seller_search", { query_length: query.length, result_count: data.length, seller_type: activeType });
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeType]);

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
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-gray-400">
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
            Search by name or verification code to confirm a seller&apos;s status and what they are authorised to sell.
          </p>
          {/* Type legend */}
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-medium">BNIB Seller</span>
              <span className="text-gray-400">— can sell sealed bottles AND decants</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
              <span className="text-blue-300 font-medium">Decant Seller</span>
              <span className="text-gray-400">— decants &amp; vials only, not BNIB</span>
            </div>
          </div>
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
                className="shrink-0 text-gray-400 hover:text-white transition text-xs"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {query && query.trim().length >= 2 && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-10 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
              {results.map((item) => {
                const isBNIB = item.type === "BNIB";
                return (
                  <button
                    key={item.type + item.code}
                    onClick={() => handlePick(item)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition first:rounded-t-2xl last:rounded-b-2xl group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${isBNIB ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20' : 'bg-blue-500/15 text-blue-400 ring-blue-500/20'}`}>
                        <CheckIcon />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-[#F5F5F7]">{item.name}</div>
                        <div className={`text-xs ${isBNIB ? 'text-emerald-500/70' : 'text-blue-500/70'}`}>
                          {isBNIB ? "BNIB — sealed bottles + decants" : "Decants & vials only"}
                        </div>
                      </div>
                    </div>
                    <span className="ml-4 shrink-0 font-mono text-xs text-gray-400 group-hover:text-gray-200 transition">
                      {item.code}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query && query.trim().length >= 2 && !searching && results.length === 0 && (
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
          <div className={`mt-6 rounded-2xl border p-6 ${selected.type === 'BNIB' ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-blue-500/25 bg-blue-500/5'}`}>
            <div className="flex items-start gap-4">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${selected.type === 'BNIB' ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' : 'bg-blue-500/20 text-blue-400 ring-blue-500/30'}`}>
                <CheckIcon />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${selected.type === 'BNIB' ? 'text-emerald-500' : 'text-blue-500'}`}>
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

                  {selected.type === "BNIB" ? (
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
                      BNIB Seller
                    </span>
                  ) : (
                    <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300">
                      Decant Seller
                    </span>
                  )}

                  {selected.tier > 0 && (
                    <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${(TIER_CONFIG[selected.tier] || TIER_CONFIG[0]).cls}`}>
                      {(TIER_CONFIG[selected.tier] || TIER_CONFIG[0]).label}
                    </span>
                  )}
                </div>

                {selected.type === "BNIB" ? (
                  <p className="mt-4 text-sm text-gray-400">
                    This seller is authorised to sell sealed / BNIB bottles and decants.
                  </p>
                ) : (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Not eligible to sell BNIB</p>
                      <p className="text-xs text-amber-200/70 mt-0.5">
                        This seller is verified for decants and vials only. If they offer sealed / BNIB bottles, do not transact — report to PFC admins.
                      </p>
                    </div>
                  </div>
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
        <p className="mt-12 text-xs text-gray-400 text-center">
          Last updated {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          &nbsp;&mdash;&nbsp;For corrections, contact PFC admins via the{" "}
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-300 transition underline underline-offset-2"
          >
            Facebook group
          </a>.
        </p>

      </main>

      <Footer />
    </div>
  );
}

