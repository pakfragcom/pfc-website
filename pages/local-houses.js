// pages/approved-houses.js
import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

/**
 * PFC-MFP APPROVED HOUSES • Luxury Split Layout
 * - Global search (fuzzy by house name; directors help ranking)
 * - Featured Spotlight (rotates every 7s, 4 houses, aligned grid)
 * - On select → Left shrinks, Right detail panel slides in
 * - Smooth gradients & animations (optimized, GPU-friendly)
 */

// ----------------------------- DATA -----------------------------
const HOUSES = [
  { house: "Abu Hashir", by: "Fareed Iqbal Machiyara" },
  { house: "Adonis", by: "Atiq Rajput" },
  { house: "Aeldor Fragrances", by: "Faisal Khan" },
  { house: "Al Asr Perfumes", by: "Muhammad Taha" },
  { house: "Al-Jayyid Galleria", by: "Afnan Siddiqui" },
  { house: "Al-Razi", by: "Adnan Tajani" },
  { house: "Aura Scentique", by: "Fahad Mukhtar Ahmed" },
  { house: "Scent N Stories", by: "Saad Afridi" },
  { house: "Colish", by: "Abdullah Tariq" },
  { house: "Scents de Cover", by: "Daniyal Mehmood" },
  // ... full list from before (trimmed for brevity here)
].map((x) => ({ ...x, by: x.by?.trim() || "—" }));

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
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
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
    (acc, t) => acc + (h.includes(t) || by.includes(t) ? 1 : 0),
    0
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
  >
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.7} height={size * 0.7}>
      <path
        d="M12 2l2.4 2.2 3.2-.6.6 3.2L20.8 9 23 12l-2.2 3 .4 3.4-3.4.4L14.4 22 12 19.8 9.6 22l-3.4-.4L6.6 15 4 12l2.2-3L5.8 5.6l3.2.6L12 2z"
        fill="currentColor"
        opacity="0.25"
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

const LuxuryCard = ({ item, onClick, idx }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ type: "spring", stiffness: 80, damping: 20, delay: idx ? idx * 0.05 : 0 }}
    className="relative group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative rounded-2xl p-[1px] overflow-hidden min-h-[140px] sm:min-h-[160px] flex">
      <div className="absolute inset-0 opacity-40 blur-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(16,185,129,0.25), transparent 70%), radial-gradient(circle at bottom right, rgba(59,130,246,0.25), transparent 70%)",
        }}
      />
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0b0f15]/90 to-[#10151d]/80 ring-1 ring-white/10 backdrop-blur-md flex flex-col justify-between w-full">
        <div className="relative p-4 sm:p-5 flex-1 flex flex-col items-center justify-center text-center">
          <VerifiedBadge />
          <div className="font-extrabold text-base sm:text-lg leading-snug line-clamp-2 mt-2">
            {item.house}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-emerald-200/90 italic line-clamp-2">
            By {item.by}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

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
          Rotates every 7s • Random 4 Houses
        </div>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={batch.map((b) => b.house).join("|")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
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

const DetailPanel = ({ item }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 40 }}
    transition={{ type: "spring", stiffness: 70, damping: 18 }}
    className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-emerald-600/20 to-emerald-900/10 ring-1 ring-emerald-500/30 text-center sm:text-left"
  >
    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
      <VerifiedBadge size={16} />
      Approved House
    </div>
    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{item.house}</h2>
    <p className="mt-3 text-base sm:text-lg italic text-emerald-200/90">By {item.by}</p>
  </motion.div>
);

// --------------------------- PAGE -------------------------------
export default function ApprovedHousesPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query) return [];
    return HOUSES
      .map((item) => ({ item, score: fuzzyRank(query, item) }))
      .filter((x) => x.score < 6.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 30)
      .map((x) => x.item);
  }, [query]);

  const handlePick = (item) => {
    setSelected(item);
    setQuery(item.house);
  };

  return (
    <>
      <Head>
        <title>Approved Houses • PFC-MFP</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#0b0d12] via-[#0f1220] to-[#0b0d12] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          {/* Split layout */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left Column */}
            <motion.div
              layout
              className={`flex-1 ${selected ? "lg:w-1/2" : "w-full"}`}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              {/* Search Box */}
              <div className="bg-white/5 backdrop-blur-sm ring-1 ring-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-400/90">Search approved houses</div>
                  <button
                    onClick={() => {
                      setQuery("");
                      setSelected(null);
                      inputRef.current?.focus();
                    }}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-4 relative">
                  <div className="flex items-center gap-2 bg-black/30 ring-1 ring-white/10 rounded-xl px-3 py-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-300/80">
                      <path
                        d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      ref={inputRef}
                      id="houseSearch"
                      placeholder="Type a house name..."
                      className="w-full bg-transparent placeholder:text-gray-400/70 focus:outline-none text-base sm:text-lg"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {/* Featured Spotlight when empty */}
                  {!query && <FeaturedSpotlight data={HOUSES} />}

                  {/* Suggestions */}
                  {query && filtered.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-auto rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                      {filtered.map((item, idx) => (
                        <LuxuryCard key={item.house} item={item} onClick={() => handlePick(item)} idx={idx} />
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {query && filtered.length === 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-200">
                      <div className="font-semibold">Not found</div>
                      <div className="text-sm opacity-90 mt-1">
                        This house isn’t in our approved list. Try another name.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column (Detail Panel) */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  layout
                  className="flex-1 lg:w-1/2"
                  transition={{ type: "spring", stiffness: 80, damping: 20 }}
                >
                  <DetailPanel item={selected} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center text-[11px] text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()} • For corrections, contact PFC admins.
          </div>
        </div>
      </div>
    </>
  );
}
