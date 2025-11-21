// pages/verify-seller.js
import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";

/**
 * VERIFIED SELLER PORTAL CHECK (Search-Only)
 * - BNIB pass includes decant selling (explicitly shown in UI)
 * - Search by name OR verification code (fuzzy)
 * - Shows suggestions ONLY when typing; no full list rendering
 * - After selecting, shows a verified card
 * - Dark, mobile-first UI (TailwindCSS assumed)
 */

// ----------------------------- DATA -----------------------------
const BNIB = [
  { name: "Abdur Rehman", code: "AR-K1DE" },
  { name: "Ahmed Raza", code: "AR-R470" },
  { name: "Aleem Dar", code: "AD-55A2" },
  { name: "Ali Rajpoot", code: "AR-MN5S" },
  { name: "Ammar Hafeez", code: "AH-G5AL" },
  { name: "Arif Umar", code: "AU-H9E9" },
  { name: "Arsala Khan", code: "AK-25PW" },
  { name: "Arslan Ghaffar", code: "AG-B41X" },
  { name: "Asad Khan Khalil", code: "AKK-ZB00" },
  { name: "Asjid", code: "A-49YI" },
  { name: "Aswad Yahya", code: "AY-EG7N" },
  { name: "Atif Memon", code: "AM-W8Q7" },
  { name: "Behzad Hassan", code: "BH-OA91" },
  { name: "Bilal Jarral", code: "BJ-II1Z" },
  { name: "Emraan Malick", code: "EM-78H2" },
  { name: "Esrar Shenwari", code: "ES-F3D6" },
  { name: "Faizan Ahmad", code: "FA-8V1J" },
  { name: "Farooq Khan", code: "FK-SD6I" },
  { name: "Farrukh Shahzad", code: "FS-25B6" },
  { name: "Hadi Hassan", code: "HH-K76A" },
  { name: "Hafiz Anas Mansoor", code: "HAM-Z368" },
  { name: "Haider Ali Mangi", code: "HAM-U89E" },
  { name: "Haider Ali Raza", code: "HAR-1S58" },
  { name: "Haris Ali Mangi", code: "HAM-X081" },
  { name: "Harris Mahmood", code: "HM-59C7" },
  { name: "Haris Saleem", code: "HS-WE741" },
  { name: "Hateem Aziz", code: "HA-12KL" },
  { name: "Hikmat Ullah", code: "HU-99PK" },
  { name: "Huzaifa Bawany", code: "HB-3R24" },
  { name: "Irfan Abuhadi", code: "IA-CI72" },
  { name: "Jawwad Saleem", code: "JS-5GQT" },
  { name: "Jazib ALi Butt", code: "JAB-5DMW" },
  { name: "Junaid Rafiq", code: "JR-77P" },
  { name: "Kabir Shaz Khan", code: "KSK-L01J" },
  { name: "Kashif Mehmood Minhas", code: "KMM-12FG" },
  { name: "Khurram Shabbir", code: "KS-W1E" },
  { name: "Muhammad Ahmad Jan", code: "MAJ-LHFX" },
  { name: "M. Amir", code: "MA-KGKF" },
  { name: "Malik Mohammad", code: "MM-DQK2" },
  { name: "Mohammad Abu Torab", code: "MAT-01F0" },
  { name: "Mohammad Khan", code: "MK-AAK9" },
  { name: "Mohsin Malik", code: "MM-K0R4" },
  { name: "Moiz Ullah", code: "MU-29W7" },
  { name: "Mudasir Ali Tunio", code: "MAT-S561" },
  { name: "Mudassir Sidhu", code: "MS-2XJB" },
  { name: "Muhammad Abu Bakar", code: "MAB-1KY5" },
  { name: "Muhammad Arsalan Tariq", code: "MAT-ATX7" },
  { name: "Muhammad Najeeb", code: "MN-3POB" },
  { name: "Muhammad Sameer", code: "MS-78FD" },
  { name: "Muhammad Hunain", code: "MH-OBJV" },
  { name: "Nabeel Akhtar", code: "NA-UJN6" },
  { name: "Nouman Ch", code: "NC-IGHV" },
  { name: "Omar Khalil", code: "OK-6RIG" },
  { name: "Qadeer Ahmad Adv", code: "QA-24K5" },
  { name: "Qamyar Khan", code: "QK-3J6T" },
  { name: "Raja Usman", code: "RU-5GPQ" },
  { name: "Rayan Sid", code: "RS-882K" }, // normalized spacing
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
  { name: "Murtaza Wasim", code: "MW-4FG" },
  { name: "Basit Ali", code: "BA-2BXJ" },
  { name: "Hammad Ansari", code: "HA-S5PK" },
  { name: "Muhammad Faisal", code: "MF-6AG9" },
  { name: "Areeb Sagheer", code: "AS-0WYH" },
  { name: "Shehryar Khalil", code: "SK-5SI" },
  { name: "Syeda Maryam Omer", code: "SMO-FS1" },
  { name: "Adeel A.", code: "AA-B9Y7" },
  { name: "Javed Khan", code: "JK-B9Y7" },
  { name: "Faizan Karim", code: "FK-B9Y7" },
  { name: "Umair Tahir", code: "UT-4FTY" },
  { name: "Tanya Zahid", code: "TZ-6NY8" },
  { name: "Ahsan Afzal", code: "AA-78KD" },
  { name: "Ahsan Salahudin Ahmed", code: "ASA-2712" },
  { name: "Hussain Riaz", code: "HR-0245" },
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

  
].map((x) => ({ ...x, type: "BNIB" }));

const DECANTERS = [
  { name: "Abdul Basit", code: "AB-TU44" },
  { name: "عبدالمھیمن عباسی", code: "AMA-40Z1" },
  { name: "Ahmad Shah", code: "AS-E2A1" },
  { name: "Arham Fawad", code: "AF-9P8I" },
  { name: "Babar Ali", code: "BA-247R" },
  { name: "Baber Khan", code: "BK-Z65X" },
  { name: "BalOch Asif", code: "BA-E0CS" },
  { name: "M Daud Amjad", code: "DA-FGN5" },
  { name: "Hassan Shah", code: "HS-1Y3J" },
  { name: "Ifrah Yousafani", code: "IY-BPN5" },
  { name: "Muhammad Bin Khalil", code: "MBK-XJL0" },
  { name: "Muhammad Bukhari", code: "MB-36K2" },
  { name: "Muhammad Talha", code: "MT-934C" },
  { name: "Muneeb Sheikh", code: "MS-48WY" },
  { name: "Naveed Anjum Kundi", code: "NAK-B55O" },
  { name: "Payam Abbasi", code: "PA-4LP7" },
  { name: "Rizvi B", code: "RB-73K" },
  { name: "Sayed Yasir Ali", code: "SYA-8TSS" },
  { name: "Syed Wasi Hassan", code: "SWH-DS12" },
  { name: "Tayyab Tariq", code: "TT-4FZ7" },
  { name: "Umar Zulfiqar", code: "UZ-G58K" },
  { name: "Zaryab Amir", code: "ZA-A8X6" },
  { name: "Muhammad Ebaad Ur Rehman", code: "MEUR-D2L" },
  { name: "Muhammad Umar", code: "MU-56JS" },
  { name: "Abid Nazar", code: "AN-5ZA8" },
  { name: "Arqam Yousaf", code: "AY-7HZ4" },
  { name: "Laraib Taimur Khan", code: "LTK-5MT7" },
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
  const name = normalize(item.name);
  const code = normalize(item.code);

  if (!q) return 9999;
  if (name.includes(q) || code.includes(q)) return 0;

  const tokens = q.split(" ").filter(Boolean);
  const tokenHits = tokens.reduce(
    (acc, t) => acc + (name.includes(t) || code.includes(t) ? 1 : 0),
    0
  );
  const tokenScore = tokens.length ? (tokens.length - tokenHits) * 0.75 : 2;
  const editScore = Math.min(
    levenshtein(q, name.slice(0, q.length)),
    levenshtein(q, code)
  );
  return tokenScore + editScore / 3;
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text);
  } catch {}
}

// --------------------------- UI PARTS ---------------------------
const VerifiedBadge = ({ size = 22 }) => (
  <span
    className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
    style={{ width: size, height: size }}
    aria-label="Verified"
    title="Verified"
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

const Pill = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-full text-sm transition",
      active
        ? "bg-white/10 text-white ring-1 ring-white/30"
        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10",
    ].join(" ")}
  >
    {children}
  </button>
);

// --------------------------- PAGE -------------------------------
export default function VerifySellerPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL"); // ALL | BNIB | DECANT
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);

  const filteredDirectory = useMemo(() => {
    const pool =
      activeType === "ALL" ? DIRECTORY : activeType === "BNIB" ? BNIB : DECANTERS;

    if (!query) return []; // 👈 No list when empty
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

  const handlePick = (item) => {
    setSelected(item);
    setQuery(item.name); // keep the query filled with chosen name
  };

  const handleCopy = (text) => {
    copyToClipboard(text);
    setCopied(text);
  };

  const bnibNotice =
    "BNIB (Brand New In Box) pass includes decant selling privileges.";

  return (
    <>
      <Head>
        <title>Verified Seller Check • PFC</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-[#0b0d12] via-[#0f1220] to-[#0b0d12] text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300 text-xs font-medium">
              <VerifiedBadge size={14} />
              Verified Seller Portal Check
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Verify a Registered Seller
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-300/90">
              Type a <span className="font-semibold">name</span> or{" "}
              <span className="font-semibold">verification code</span> to check.
              <br className="hidden sm:block" />
              <span className="text-emerald-300/90">{bnibNotice}</span>
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white/5 backdrop-blur-sm ring-1 ring-white/10 rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Pill active={activeType === "ALL"} onClick={() => setActiveType("ALL")}>
                  All
                </Pill>
                <Pill active={activeType === "BNIB"} onClick={() => setActiveType("BNIB")}>
                  BNIB (incl. Decant)
                </Pill>
                <Pill
                  active={activeType === "DECANT"}
                  onClick={() => setActiveType("DECANT")}
                >
                  Decanters/Vials
                </Pill>
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
              <label htmlFor="sellerSearch" className="sr-only">
                Search by name or code
              </label>
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
                  id="sellerSearch"
                  placeholder="Type a name or code (e.g., 'SM-222', 'Zakir')"
                  className="w-full bg-transparent placeholder:text-gray-400/70 focus:outline-none text-base sm:text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Suggestions: only when typing */}
              {query && filteredDirectory.length > 0 && (
                <div className="mt-3 grid gap-2 max-h-64 overflow-auto rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                  {filteredDirectory.map((item) => (
                    <button
                      key={item.type + item.code}
                      onClick={() => handlePick(item)}
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <VerifiedBadge />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-300/80">
                            {item.type === "BNIB"
                              ? "BNIB (includes Decanting)"
                              : "Decanter / Vial Seller"}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-gray-200 group-hover:text-white bg-white/10 px-2 py-1 rounded">
                        {item.code}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results state */}
              {query && filteredDirectory.length === 0 && (
                <div className="mt-3 p-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-200">
                  <div className="font-semibold">Not found</div>
                  <div className="text-sm opacity-90 mt-1">
                    This name/code isn’t in our registered list. Check spelling,
                    try a shorter part of the name, or search by code like{" "}
                    <span className="font-mono">AA-123X</span>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected result card */}
          {selected && (
            <div className="bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <VerifiedBadge size={28} />
                <div className="flex-1">
                  <div className="text-sm uppercase tracking-wider text-emerald-300/90 font-semibold">
                    Verified Seller
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                    {selected.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm px-2.5 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20">
                      <span className="font-mono">{selected.code}</span>
                      <button
                        onClick={() => {
                          copyToClipboard(selected.code);
                          setCopied(selected.code);
                        }}
                        className="opacity-80 hover:opacity-100"
                        title="Copy code"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                          <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.7" />
                        </svg>
                      </button>
                    </span>
                    <span className="inline-flex items-center text-xs sm:text-sm px-2.5 py-1.5 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 text-emerald-200">
                      {selected.type === "BNIB"
                        ? "BNIB (includes Decanting)"
                        : "Decanter / Vial Seller"}
                    </span>
                  </div>

                  {selected.type === "BNIB" && (
                    <p className="mt-3 text-sm text-emerald-100/90">
                      Note: BNIB status automatically permits decant selling.
                    </p>
                  )}
                </div>
              </div>
              {copied === selected.code && (
                <div className="mt-3 text-xs text-emerald-200">Code copied to clipboard.</div>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-xs text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()} • For corrections, contact PFC admins.
          </div>
        </div>
      </div>
    </>
  );
}
