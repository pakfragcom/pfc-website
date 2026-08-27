import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabaseAdmin } from '../../lib/supabase-admin';

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

const TYPE_LABELS = { bnib: 'BNIB', partial: 'Partial', decant: 'Decant' };
const WINDOWS = [
  { id: '7d',  label: '7 days',  days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
];

export async function getStaticProps() {
  const nowIso = new Date().toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Open, non-expired requests — drives the demand board itself.
  const { data: openRows } = await supabaseAdmin
    .from('iso_requests')
    .select('fragrance_id, fragrance_name, type, created_at')
    .eq('status', 'open')
    .gt('expires_at', nowIso);

  // All requests in the last 90 days regardless of status — drives Insights
  // (a historical "what were people looking for" signal, not "still open").
  const { data: recentRows } = await supabaseAdmin
    .from('iso_requests')
    .select('fragrance_name, created_at')
    .gte('created_at', ninetyDaysAgo);

  // Group open requests by fragrance (fallback to normalized name for
  // unlinked free-text entries so they still aggregate together).
  const groups = {};
  for (const r of openRows || []) {
    const key = r.fragrance_id || `name:${r.fragrance_name.trim().toLowerCase()}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        fragrance_id: r.fragrance_id,
        name: r.fragrance_name.trim(),
        linked: !!r.fragrance_id,
        total: 0,
        breakdown: { bnib: 0, partial: 0, decant: 0 },
        newest: r.created_at,
      };
    }
    const g = groups[key];
    g.total += 1;
    g.breakdown[r.type] = (g.breakdown[r.type] || 0) + 1;
    if (r.created_at > g.newest) g.newest = r.created_at;
  }
  const board = Object.values(groups).sort((a, b) => b.total - a.total);

  // Insights: top 10 per window, counting all requests (any status) in range.
  const now = Date.now();
  const insights = {};
  for (const w of WINDOWS) {
    const cutoff = now - w.days * 24 * 60 * 60 * 1000;
    const counts = {};
    for (const r of recentRows || []) {
      if (new Date(r.created_at).getTime() < cutoff) continue;
      const key = r.fragrance_name.trim();
      counts[key] = (counts[key] || 0) + 1;
    }
    insights[w.id] = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  return {
    props: { board, insights },
    revalidate: 180,
  };
}

export default function IsoExplore({ board, insights }) {
  const [selected, setSelected] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsWindow, setInsightsWindow] = useState('7d');

  const maxTotal = board.length ? board[0].total : 1;

  return (
    <>
      <Head>
        <title>Explore ISO Demand | PFC</title>
        <meta name="description" content="See which fragrances the PakFrag community is searching for most right now." />
        <link rel="canonical" href="https://pakfrag.com/iso/explore" />
      </Head>

      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Header />
        <main className="pt-28 pb-20 px-6 relative">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <Link href="/iso" className="text-xs text-gray-400 hover:text-gray-300 transition mb-3 inline-block">← Back</Link>
                <p className="text-xs uppercase tracking-[0.25em] text-[#94aea7] mb-2">Live demand</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">What the community is looking for</h1>
              </div>
              <button
                onClick={() => setInsightsOpen(v => !v)}
                aria-expanded={insightsOpen}
                aria-controls="insights-panel"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-gray-200 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
                </svg>
                Insights
              </button>
            </div>
            <p className="text-sm text-gray-400 max-w-xl mb-10">
              Ranked by open requests right now. Tap a fragrance to see the BNIB / Partial / Decant breakdown.
            </p>

            {insightsOpen && (
              <div id="insights-panel" className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Most requested</h2>
                  <div className="flex gap-1 rounded-full bg-black/40 p-1">
                    {WINDOWS.map(w => (
                      <button key={w.id} onClick={() => setInsightsWindow(w.id)}
                        className={`px-3 py-1 rounded-full text-xs transition ${
                          insightsWindow === w.id ? 'bg-[#2a5c4f] text-white' : 'text-gray-400 hover:text-white'
                        }`}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                {insights[insightsWindow].length === 0 ? (
                  <p className="text-sm text-gray-400">No ISO activity in this window yet.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {insights[insightsWindow].map((item, i) => (
                      <li key={item.name} className="flex items-center justify-between text-sm rounded-lg px-3 py-2 odd:bg-white/[0.02]">
                        <span className="text-gray-200"><span className="text-gray-500 mr-2 tabular-nums">{i + 1}.</span>{item.name}</span>
                        <span className="text-[#94aea7] font-medium tabular-nums">{item.count}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {board.length === 0 ? (
              <div className="text-center py-24 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-gray-400 text-sm mb-4">No open ISOs yet — be the first.</p>
                <Link href="/iso/post"
                  className="inline-flex rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
                  Post an ISO
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
                {board.map(item => {
                  const scale = 0.55 + 0.45 * (item.total / maxTotal);
                  const accent = accentColor(item.name);
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#557d72]/40 transition p-5 flex flex-col gap-3"
                        style={{ opacity: 0.7 + 0.3 * (item.total / maxTotal) }}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
                            style={{
                              width: `${44 * scale + 20}px`,
                              height: `${44 * scale + 20}px`,
                              background: `linear-gradient(135deg, ${accent}, #0a0a0a)`,
                              fontSize: `${14 * scale + 6}px`,
                            }}
                            aria-hidden="true"
                          >
                            {item.total}
                          </div>
                          <span className="text-xs text-gray-500">{item.total === 1 ? 'request' : 'requests'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                          {!item.linked && <p className="text-[11px] text-gray-500 mt-0.5">Not yet in catalog</p>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-12 text-center">
              <Link href="/iso/post"
                className="inline-flex rounded-xl border border-white/15 hover:border-[#557d72]/50 px-6 py-2.5 text-sm text-gray-300 hover:text-white transition">
                Post your own ISO →
              </Link>
            </div>
          </div>
        </main>
        <Footer />

        {selected && <BreakdownModal item={selected} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}

function BreakdownModal({ item, onClose }) {
  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Demand breakdown for ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h3 className="text-base font-semibold text-white pr-8 mb-1">{item.name}</h3>
        <p className="text-xs text-gray-400 mb-5">{item.total} open {item.total === 1 ? 'request' : 'requests'}</p>
        <div className="space-y-2.5">
          {['bnib', 'partial', 'decant'].map(t => {
            const count = item.breakdown[t] || 0;
            const pct = item.total ? Math.round((count / item.total) * 100) : 0;
            return (
              <div key={t}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{TYPE_LABELS[t]}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <Link href="/iso/post" onClick={onClose}
          className="mt-6 block text-center rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
          I'm looking for this too →
        </Link>
      </div>
    </div>
  );
}
