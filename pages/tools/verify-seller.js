// pages/tools/verify-seller.js
import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { trackEvent } from "../../lib/analytics";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

/**
 * VERIFIED SELLER PORTAL CHECK (Search-Only)
 * - BNIB pass includes decant selling (explicitly shown in UI)
 * - Search by name OR verification code (fuzzy)
 * - Shows suggestions ONLY when typing; no full list rendering
 * - After selecting, shows a verified card
 */

// ----------------------------- DATA -----------------------------
const BNIB = [
  { name: "Abdur Rehman", code: "AR-K1DE" },
  { name: "Ahmed Raza", code: "AR-R470" },
  { name: "Ammar Hafeez", code: "AH-G5AL" },
  { name: "Arif Umar", code: "AU-H9E9" },
  { name: "Arslan Ghaffar", code: "AG-B41X" },
  { name: "Asad Khan Khalil", code: "AKK-ZB00" },
  { name: "Asjid", code: "A-49YI" },
  { name: "Aswad Yahya", code: "AY-EG7N" },
  { name: "Atif Memon", code: "AM-W8Q7" },
  { name: "Behzad Hassan", code: "BH-OA91" },
  { name: "Bilal Jarral", code: "BJ-II1Z" },
  { name: "Emraan Malick", code: "EM-78H2" },
  { name: "Esrar Shenwari", code: "ES-F3D6" },
  { name: "Farooq Khan", code: "FK-SD6I" },
  { name: "Farrukh Shahzad", code: "FS-25B6" },
  { name: "Hadi Hassan", code: "HH-K76A" },
  { name: "Hafiz Anas Mansoor", code: "HAM-Z368" },
  { name: "Haider Ali Mangi", code: "HAM-U89E" },
  { name: "Haider Ali Raza", code: "HAR-1S58" },
  { name: "Haris Ali Mangi", code: "HAM-X081" },
  { name: "Haris Saleem", code: "HS-WE741" },
  { name: "Huzaifa Bawany", code: "HB-3R24" },
  { name: "Irfan Abuhadi", code: "IA-CI72" },
  { name: "Jawwad Saleem", code: "JS-5GQT" },
  { name: "Jazib ALi Butt", code: "JAB-5DMW" },
  { name: "Junaid Rafiq", code: "JR-77P" },
  { name: "Kabir Shaz Khan", code: "KSK-L01J" },
  { name: "Khurram Shabbir", code: "KS-W1E" },
  { name: "Muhammad Ahmad Jan", code: "MAJ-LHFX" },
  { name: "M. Amir", code: "MA-KGKF" },
  { name: "Malik Mohammad", code: "MM-DQK2" },
  { name: "Mohammad Abu Torab", code: "MAT-01F0" },
  { name: "Mohammad Khan", code: "MK-AAK9" },
  { name: "Mohsin Malik", code: "MM-K0R4" },
  { name: "Moiz Ullah", code: "MU-29W7" },
  { name: "Mudasir Ali Tunio", code: "MAT-S561" },
  { name: "Asad Agha", code: "AA-A6BT" },
  { name: "Muhammad Arsalan Tariq", code: "MAT-ATX7" },
  { name: "Muhammad Najeeb", code: "MN-3POB" },
  { name: "Muhammad Hunain", code: "MH-OBJV" },
  { name: "Nabeel Akhtar", code: "NA-UJN6" },
  { name: "Nouman Ch", code: "NC-IGHV" },
  { name: "Omar Khalil", code: "OK-6RIG" },
  { name: "Qadeer Ahmad Adv", code: "QA-24K5" },
  { name: "Qamyar Khan", code: "QK-3J6T" },
  { name: "Raja Usman", code: "RU-5GPQ" },
  { name: "Saad Chawla", code: "SC-33OH" },
  { name: "Saad Imran Khan", code: "SIK-6HK1" },
  { name: "Saad Saleem", code: "SS-VRPB" },
  { name: "Sehar Javed", code: "SJ-0ACZ" },
  { name: "Shahid Iqbal", code: "SI-O7M1" },
  { name: "Shahzaib Mahtab", code: "SM-3655" },
  { name: "Shaikh Abdul Azeem", code: "SAA-PW5B" },
  { name: "Shehroz Malik", code: "SM-222" },
  { name: "Sheheryar Shahid", code: "SS-51BR" },
  { name: "Sohail Khan", code: "SK-54ZX" },
  { name: "Sohail Shoukat", code: "SS-878Q" },
  { name: "Sonu Sameer", code: "SS-631A" },
  { name: "Tameem Faheem / Shopforever", code: "TF-9701" },
  { name: "Usama Naeem", code: "UN-B79Z" },
  { name: "Waqas Ahmed / Waqas Ahmed", code: "WA-K5Z6" },
  { name: "Xohayb Hasan", code: "ZH-789G" },
  { name: "Zaib Ali", code: "ZA-B777" },
  { name: "Zakir Swati", code: "ZS-KW72" },
  { name: "Hammad Ansari", code: "HA-S5PK" },
  { name: "Muhammad Faisal", code: "MF-6AG9" },
  { name: "Areeb Sagheer", code: "AS-0WYH" },
  { name: "Shehryar Khalil", code: "SK-5SI" },
  { name: "Zahid Khan", code: "ZK-J8GY" },
  { name: "Umair Tahir", code: "UT-4FTY" },
  { name: "Azib Malik", code: "AM-P236" },
  { name: "Zee Kay", code: "ZK-H7FT" },
  { name: "Malik Hasseb Bangash", code: "MAB-0176" },
  { name: "Rehman Khan", code: "RK-A450" },
  { name: "Arqam Zafar", code: "AZ-3YC1" },
  { name: "Hassan Ali", code: "HA-2GKA" },
  { name: "Muhammad Saad", code: "MS-6TJ9" },
  { name: "Ahmad Talat", code: "AH-33K3" },
  { name: "Muhammad Laman Samo", code: "MLS-G7D2" },
  { name: "Muhammad Hamza", code: "MH-5H3M" },
  { name: "Mubbashir Tunio", code: "MT-S562" },
  { name: "Muhammad Aylee", code: "MA-5S5T" },
  { name: "Baber Khan", code: "BK-Z65X" },
  { name: "Ahsan Fayyaz", code: "AF-Y6U3" },
  { name: "Muhammad Huzaifa Tayyab", code: "MHT-P2D6" },
  { name: "Muhammad Ebaad Ur Rehman", code: "MEUR-D2L" },
  { name: "Sheikh Basim", code: "SB-6J4Z" },
  { name: "Zawar Qureshi", code: "ZQ-J828" },
  { name: "Kanwal Basim", code: "KB-6J4Z" },
  { name: "Sharan Kapoor", code: "SK-6T49" },
  { name: "Hussnain Mehmood", code: "HM-J8GY" },
  { name: "Anwar Ul Mubeen", code: "AUM-K9HU" },
  { name: "Amir Khan", code: "AK-G4A4" },
  { name: "Abu Sufyan Kamboh", code: "ASK-1A1N" },
  { name: "Naveed Anjum Kundi", code: "NAK-B55O" },
  { name: "Basit Ali", code: "BA-2BXJ" },
  { name: "Syed Waheed Zada", code: "SWZ-R52X" },
  { name: "Aimal Kakar", code: "AK-O6X8" },
  { name: "A. Raza", code: "AR-1K56" },
  { name: "Muhammad A", code: "MA-5H7D" },
  { name: "Syeda Maryam Omer", code: "SMO-FS1" },
  { name: "Saif Afridi", code: "SA-3H4T" },
].map((x) => ({ ...x, type: "BNIB" }));

const DECANTERS = [
  { name: "Abdul Basit", code: "AB-TU44" },
  { name: "عبدالمھیمن عباسی", code: "AMA-40Z1" },
  { name: "Ahmad Shah", code: "AS-E2A1" },
  { name: "Arham Fawad", code: "AF-9P8I" },
  { name: "Ifrah Yousafani", code: "IY-BPN5" },
  { name: "Faizuleman Faisal Marfani", code: "FFM-4U8J" },
  { name: "BalOch Asif", code: "BA-E0CS" },
  { name: "M Daud Amjad", code: "DA-FGN5" },
  { name: "Hassan Shah", code: "HS-1Y3J" },
  { name: "Ahmed Soomro", code: "AS-5I9K" },
  { name: "Ismail Shahzad", code: "IS-600P" },
  { name: "Mudasir Sadiq Chugtai", code: "MSC-T4H3" },
  { name: "Syed Hamza Naeem", code: "SHN-0512" },
  { name: "Muhammad Bin Khalil", code: "MBK-XJL0" },
  { name: "Muhammad Bukhari", code: "MB-36K2" },
  { name: "Muhammad Talha", code: "MT-934C" },
  { name: "Muneeb Sheikh", code: "MS-48WY" },
  { name: "Payam Abbasi", code: "PA-4LP7" },
  { name: "Rizvi B", code: "RB-73K" },
  { name: "Sayed Yasir Ali", code: "SYA-8TSS" },
  { name: "Syed Wasi Hassan", code: "SWH-DS12" },
  { name: "Tayyab Tariq", code: "TT-4FZ7" },
  { name: "Umar Zulfiqar", code: "UZ-G58K" },
  { name: "Zaryab Amir", code: "ZA-A8X6" },
  { name: "Saad Farukh", code: "SF-7223" },
  { name: "Ahsan Afzal", code: "AA-78KD" },
  { name: "Sharoon Arsin", code: "SA-5GA8" },
  { name: "Abdullah Akram", code: "AA-7TX4" },
  { name: "Muhammad Ali", code: "MAA-3J6H" },
  { name: "Hamza Rehan", code: "HR-H79P" },
  { name: "Ahsan Habib", code: "AH-J80Q" },
  { name: "Ali Rajpoot", code: "AR-MN5S" },
].map((x) => ({ ...x, type: "DECANT" }));

const DIRECTORY = [...BNIB, ...DECANTERS];

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
export default function VerifySellerPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);

  const filteredDirectory = useMemo(() => {
    const pool = activeType === "ALL" ? DIRECTORY : activeType === "BNIB" ? BNIB : DECANTERS;
    if (!query) return [];
    return pool
      .map((item) => ({ item, score: fuzzyRank(query, item) }))
      .filter((x) => x.score < 6.5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 25)
      .map((x) => x.item);
  }, [query, activeType]);

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
    setQuery(item.name);
    trackEvent("seller_verified", { seller_type: item.type });
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>Verify a Seller &mdash; PFC</title>
        <meta name="description" content="Check if a fragrance seller is verified by Pakistan Fragrance Community." />
      </Head>

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
              type="search"
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
                  {/* Code badge + copy */}
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

                  {/* Type badge */}
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
                    {selected.type === "BNIB" ? "BNIB — includes Decanting" : "Decanter / Vial Seller"}
                  </span>
                </div>

                {selected.type === "BNIB" && (
                  <p className="mt-4 text-sm text-gray-400">
                    BNIB status automatically grants decant selling privileges.
                  </p>
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
