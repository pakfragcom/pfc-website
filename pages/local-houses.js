// pages/approved-houses.js
import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

/**
 * PFC-MFP APPROVED HOUSES • Luxury Search + Featured Spotlight
 * - Global search (fuzzy by house name; directors help ranking)
 * - Suggestions only while typing (no full list dump)
 * - Click to reveal a polished detail card (House + Creative Director)
 * - When search box is empty: a rotating Featured Spotlight grid
 *   • Exactly 4 houses per cycle (balanced)
 *   • 2×2 grid on mobile, 1×4 row on desktop
 *   • Animated gradient borders, spotlight glow, subtle motion
 * - Dark, billion-dollar luxury aesthetic (TailwindCSS assumed)
 */

// ----------------------------- DATA -----------------------------
const HOUSES = [
  { house: "Abu Hashir", by: "Fareed Iqbal Machiyara" },
  { house: "Adonis", by: "Atiq Rajput" },
  { house: "Aeldor Fragrances", by: "Faisal Khan" },
  { house: "Al Asr Perfumes", by: "Muhammad Taha" },
  { house: "Al-Jayyid Galleria", by: "Afnan Siddiqui" },
  { house: "Al-Razi", by: "Adnan Tajani" },
  { house: "Alawaisfragrances", by: "Sharjeel Sheikh and Farooq Sheikh" },
  { house: "Aldora Fragrances", by: "Aiman Akber Ali & Zoya Aimannj" },
  { house: "Allure Perfume Oils & Attars", by: "Narina Shams" },
  { house: "Arcano Parfum", by: "Abdul Rafaay Qureshi" },
  { house: "ARCHI SCENT.", by: "Asim Jalil, & Syed Mohammad Talha" },
  { house: "Aroma World", by: "Uzair Jaleel" },
  { house: "Arome", by: "Ahsan Iqbal" },
  { house: "Attaricous", by: "Osama Altaf" },
  { house: "Aura Scentique", by: "Fahad Mukhtar Ahmed" },
  { house: "Ausaan", by: "Muhammad Umar" },
  { house: "Avital Perfumes", by: "Saad Maahir" },
  { house: "Bahar Scentiments", by: "Waseem Pasha" },
  { house: "Balsamico Fragrances", by: "Syed Osama bin Mazhar" },
  { house: "Bavari Perfumery", by: "Mian Abdul Samad" },
  { house: "Bin Tariq Fragrances", by: "Sohaib Ahmed" },
  { house: "CADAR", by: "Rouhaan Faiz Chaudry" },
  { house: "Carizmatic Perfumes", by: "Muhammad Bilal Khan" },
  { house: "CHAPS", by: "Anas Sabrani" },
  { house: "Colish", by: "Abdullah Tariq" },
  { house: "Cover Outfit", by: "" },
  { house: "Crete D'or", by: "Syed Yousaf Shah" },
  { house: "D Fragrance", by: "Danish Khan" },
  { house: "De dallad", by: "Farooq Khan" },
  { house: "Devior", by: "M. Furqan Rashid" },
  { house: "Divine in Paris", by: "Hammad Ansari" },
  { house: "Dua Fragrances", by: "" },
  { house: "Dynamo Perfumes", by: "Usama Ch." },
  { house: "Elegance Perfumes", by: "Asif Baloch" },
  { house: "Enchanté Perfumes", by: "Bilal Sohail" },
  { house: "ESSENZA", by: "AbuBakar Nawab" },
  { house: "Eternal Impressions", by: "Muddasir Ahmed Sheikh" },
  { house: "EverScent", by: "Sami Navaid" },
  { house: "FAAYAB", by: "Wakas Kokhar" },
  { house: "Fab Fragrances", by: "Salman" },
  { house: "FBM Scents", by: "Fahad Ali" },
  { house: "Folle", by: "Huzaifa Bawany" },
  { house: "Fragaro", by: "Zunair Shakeel" },
  { house: "Fragrances From ALEE", by: "Ali Choudhary" },
  { house: "Fragyard", by: "Faeez Hassan" },
  { house: "Franade", by: "Abdullah Nasir" },
  { house: "Freakfragrance", by: "Muhammad Nazim Khan" },
  { house: "Fumers", by: "Mohsin Ali" },
  { house: "Fusion Fragrances", by: "Hassan Jan Siddiqui" },
  { house: "GAIA Parfums & Raza Perfumes", by: "Ovais Saleem" },
  { house: "Genzed", by: "Sheryar Shahid" },
  { house: "House of Presence", by: "Ali Faizan" },
  { house: "House Of SR", by: "Irfan Memon" },
  { house: "Ibn-E-Noor Fragrances", by: "Hashaam Noor" },
  { house: "IKSAS SCENTS", by: "Iftikhar Khan" },
  { house: "INAR Fragrances", by: "Azeem Ibrahim" },
  { house: "Infuse Fragrances", by: "Shayan Younus and Itban Bazil" },
  { house: "Inn-o-scents", by: "Hamza Javed" },
  { house: "Ismaeelmuhammad.Pk", by: "Ismaeel Muhammad" },
  { house: "Jabl e Rehmat", by: "Abid" },
  { house: "Jogi", by: "Fahad Hanif & Fareed Iqbal Machiyara" },
  { house: "Joy&Spray", by: "S. Hassan Raza Kazmi" },
  { house: "Karachi Perfumery", by: "Muhammad Saad Basir" },
  { house: "Khusboo-e-Khaas", by: "Noman Abdul Razzaq" },
  { house: "Kingsmen Perfumes", by: "Abdullah Khan Yousafzai" },
  { house: "Lumineux Parfums", by: "Awais Saleem" },
  { house: "Luxe Aroma", by: "Mansoor Saleem" },
  { house: "Luxemy Perfumes", by: "Murtaza Hassan Shah" },
  { house: "Mahdi", by: "Ali Raza Khatri" },
  { house: "Manaal Olfactives", by: "Ali Raza Khatri" },
  { house: "Marib Fragrances", by: "Muhammad Shamaan Patel" },
  { house: "Miraaz", by: "Karim Kalani & Salik Ahmad Sheikh" },
  { house: "MOAS Perfumes", by: "Aqib Khan & Osman Khan" },
  { house: "Muhaaf", by: "Furqan Feroz" },
  { house: "NIOI & Santir Bon", by: "Abid Ayub" },
  { house: "Nishaan", by: "Nishaan E Zehra & Zain Raza" },
  { house: "Noor Fragrances", by: "Noor Muhammad" },
  { house: "Notes", by: "Atif Sheikh" },
  { house: "Notes Club", by: "Syed Shayan Ul Huda" },
  { house: "Oud Al Haram", by: "Ibrahim Shazad" },
  { house: "Pakistan Perfumes", by: "Abdullah Bhatti" },
  { house: "Peirama Parfums", by: "Hasan Bin Nasim" },
  { house: "Perfume Parlour", by: "Amir" },
  { house: "Perfumerie", by: "M. Naim Majeed" },
  { house: "Perfumes Hub", by: "Rizwan Jameel" },
  { house: "Pioneer Fragrances", by: "Osama Sheikh" },
  { house: "Qarigari", by: "Farooq Fayyaz" },
  { house: "Rawaha", by: "Uzair Punjani" },
  { house: "Reve Fragrance", by: "Usman Ali" },
  { house: "Rivendell Colognes", by: "Daniyal Khan" },
  { house: "RJ Fragrances", by: "Muhammad Raza Jiwani" },
  { house: "Roux Perfumes", by: "Waqar Mahmood" },
  { house: "Sahraat Fragrances", by: "Abdullah Noor" },
  { house: "Scent in a Bottle", by: "Omer Razaque" },
  { house: "Scent It", by: "Umair Saleem" },
  { house: "Scent N Stories", by: "Saad Afridi" },
  { house: "Scent Profile", by: "Mujahid Abbas Naqvi" },
  { house: "Scented", by: "Faizy Shykh" },
  { house: "Scentefy", by: "Saad Ahmed Tamimi" },
  { house: "Scentica", by: "Huzaifa Javeed Khan" },
  { house: "Scentiments", by: "Haider Ali Mangi" },
  { house: "Scentinio", by: "Raza Bashir" },
  { house: "Scentiorita", by: "Abdul Latif Orakzai" },
  { house: "Scentncare", by: "Laraib Taimur Khan" },
  { house: "Scentraction", by: "Bashaar Ashraf" },
  { house: "Scentriqa", by: "Syed Abdul Waris" },
  { house: "Scentrome", by: "Usman Shoaib Khawaja & Khawaja Hamza" },
  { house: "Scent St.", by: "Tehmina" },
  { house: "Scents By Amir", by: "Shan Ali" },
  { house: "Scents de Cover", by: "Daniyal Mehmood" },
  { house: "Scents Fusion", by: "Bilal Haroon" },
  { house: "Scents Mania", by: "Habib Abdullah" },
  { house: "Scents Paradise", by: "Haya Khan" },
  { house: "Secret Aroma", by: "Irfan Sumra" },
  { house: "Sesky Perfumes", by: "Hammad Masood" },
  { house: "Seven Fragrances", by: "Waleed A Malik" },
  { house: "SJ Fragrances", by: "S. Jawad Hussain Shah" },
  { house: "Stellare", by: "Rahim Wahid" },
  { house: "Suroor", by: "Wajahat Ali Siddiqui" },
  { house: "Swan Perfumes", by: "Anas Shiwani" },
  { house: "The Fragrance Square", by: "Syed Rizwan Ali" },
  { house: "Vibes", by: "Junaid" },
  { house: "Whiffs Fragrances", by: "Faraz" },
  { house: "Yesfir-Scents", by: "Ch. Mahad Ahmed" },
  { house: "Zeist Fragrances", by: "Ezazullah" },
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

// --- Unified card style (used for Search Results + Featured) ---
const LuxuryCard = ({ item, onClick, idx }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.4, delay: idx ? idx * 0.05 : 0, ease: "easeOut" }}
    className="relative group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative rounded-2xl p-[1px] overflow-hidden min-h-[140px] sm:min-h-[160px] flex">
      <div
        className="absolute inset-0 opacity-40 blur-xl pointer-events-none animate-spin-slower"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(16,185,129,0.25), rgba(59,130,246,0.25), rgba(16,185,129,0.25))",
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
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          }}
        />
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
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-[#0b0d12] via-[#0f1220] to-[#0b0d12] text-white">
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-gray-300/80"
                >
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
                  placeholder='Type a house name (e.g., "Scent N Stories")'
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
                    This house isn’t in our approved list. Check spelling or try a shorter part of the name.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected card */}
          {selected && (
            <div className="mt-6">
              <LuxuryCard item={selected} />
            </div>
          )}

          <div className="text-center text-[11px] text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()} • For corrections, contact PFC admins.
          </div>
        </div>
      </div>

      {/* Gradient spin animation */}
      <style jsx global>{`
        @keyframes spin-slower {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slower {
          animation: spin-slower 14s linear infinite;
        }
      `}</style>
    </>
  );
}
