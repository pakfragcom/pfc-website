import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getServerSideProps } from '../../lib/admin-guard';
export { getServerSideProps };

const TYPE_LABELS = { bnib: 'BNIB', partial: 'Partial', decant: 'Decant' };
const TYPE_COLORS = {
  bnib:    'text-sky-400 bg-sky-500/10 ring-sky-500/20',
  partial: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  decant:  'text-purple-400 bg-purple-500/10 ring-purple-500/20',
};
const STATUS_COLORS = {
  open:      'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  contacted: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
  fulfilled: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  expired:   'text-gray-400 bg-white/5 ring-white/10',
  cancelled: 'text-red-400 bg-red-500/10 ring-red-500/20',
};
const FILTERS = ['open', 'contacted', 'fulfilled', 'expired', 'cancelled', 'all'];

const ADMIN_IDENTITY = { type: 'admin', displayName: 'Admin', permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true } };

export default function AdminIso({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const [requests, setRequests]     = useState([]);
  const [counts, setCounts]         = useState({ open: 0, contacted: 0, fulfilled: 0, expired: 0, cancelled: 0, all: 0 });
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [filter, setFilter]         = useState('open');
  const [expanded, setExpanded]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [noteEdits, setNoteEdits]   = useState({});
  const [sellerPickerFor, setSellerPickerFor] = useState(null);
  const [sellers, setSellers]       = useState(null);
  const [sellerQuery, setSellerQuery] = useState('');

  async function load(status) {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/iso?status=${status}`);
      if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
      if (!res.ok) throw new Error('Failed to load ISO requests');
      const data = await res.json();
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setCounts(data.counts || {});
    } catch {
      setLoadError('Could not load ISO requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(filter); }, [filter]);

  async function updateStatus(id, status) {
    setActionLoading(id + status);
    try {
      await fetch('/api/admin/iso', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await load(filter);
    } finally {
      setActionLoading(null);
    }
  }

  async function saveNote(id) {
    setActionLoading(id + 'note');
    try {
      await fetch('/api/admin/iso', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_notes: noteEdits[id] ?? '' }),
      });
      await load(filter);
    } finally {
      setActionLoading(null);
    }
  }

  async function openSellerPicker(id) {
    setSellerPickerFor(id);
    setSellerQuery('');
    if (sellers) return;
    try {
      const res = await fetch('/api/admin/sellers');
      if (res.ok) setSellers(await res.json());
    } catch {
      setSellers([]);
    }
  }

  async function redirectToSeller(id, seller) {
    setActionLoading(id + 'redirect');
    try {
      await fetch('/api/admin/iso', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fulfilled_seller_id: seller.id }),
      });
      setSellerPickerFor(null);
      await load(filter);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = requests;
  const matchingSellers = (sellers || []).filter(s =>
    sellerQuery.trim().length >= 1 &&
    (s.name.toLowerCase().includes(sellerQuery.toLowerCase()) || s.code.toLowerCase().includes(sellerQuery.toLowerCase()))
  ).slice(0, 8);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/pfc-mgmt/login');
  }

  return (
    <>
      <Head><title>ISO Requests | PFC Admin</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="iso" identity={identity} onLogout={handleLogout} />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">ISO Requests</h1>
              <p className="text-sm text-gray-400 mt-0.5">{counts.open} open · {counts.fulfilled} fulfilled</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm capitalize transition ${
                  filter === f
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}>
                {f} {counts[f] > 0 && <span className="ml-1 text-xs opacity-70">{counts[f]}</span>}
              </button>
            ))}
          </div>

          {loadError ? (
            <div className="text-center py-20">
              <p className="text-sm text-red-400 mb-3">{loadError}</p>
              <button onClick={() => load(filter)}
                className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition">
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-20 text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No {filter === 'all' ? '' : filter} ISO requests.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(req => (
                <div key={req.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${TYPE_COLORS[req.type] || ''}`}>
                          {TYPE_LABELS[req.type] || req.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${STATUS_COLORS[req.status]}`}>
                          {req.status}
                        </span>
                        {req.type === 'partial' && req.fill_level && (
                          <span className="text-xs text-gray-400">Fill: {req.fill_level}</span>
                        )}
                        {req.type === 'decant' && req.decant_amount && (
                          <span className="text-xs text-gray-400">{req.decant_amount}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{req.fragrance_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.requester_name} · {req.whatsapp}
                        {req.sellers?.name && ` · Redirected to ${req.sellers.name} (${req.sellers.code})`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(req.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                        className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
                        {expanded === req.id ? 'Collapse' : 'Details'}
                      </button>
                      <a href={`https://wa.me/${req.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 text-center">
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {expanded === req.id && (
                    <div className="border-t border-white/8 px-5 py-4 space-y-4">
                      {req.notes && (
                        <div className="text-xs">
                          <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Notes</p>
                          <p className="text-gray-300">{req.notes}</p>
                        </div>
                      )}

                      {/* Redirect to seller — the commission-earning action */}
                      <div>
                        <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1.5">Redirect to seller</p>
                        {sellerPickerFor === req.id ? (
                          <div className="relative max-w-xs">
                            <input
                              type="text"
                              autoFocus
                              value={sellerQuery}
                              onChange={e => setSellerQuery(e.target.value)}
                              placeholder="Search seller name or code…"
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#557d72]"
                            />
                            {sellerQuery.trim().length >= 1 && (
                              <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-lg border border-white/10 bg-[#111] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                {sellers === null ? (
                                  <div className="px-3 py-2 text-xs text-gray-400">Loading sellers…</div>
                                ) : matchingSellers.length === 0 ? (
                                  <div className="px-3 py-2 text-xs text-gray-400">No matching sellers.</div>
                                ) : matchingSellers.map(s => (
                                  <button key={s.id} type="button" onMouseDown={() => redirectToSeller(req.id, s)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition text-xs">
                                    <span className="text-white">{s.name}</span>
                                    <span className="text-gray-400">{s.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <button onClick={() => setSellerPickerFor(null)}
                              className="mt-1.5 text-[11px] text-gray-400 hover:text-white transition">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => openSellerPicker(req.id)}
                            disabled={actionLoading === req.id + 'redirect'}
                            className="text-xs bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                            {req.fulfilled_seller_id ? 'Change seller' : 'Pick a seller →'}
                          </button>
                        )}
                      </div>

                      {/* Status actions */}
                      <div className="flex flex-wrap gap-2">
                        {['open', 'contacted', 'fulfilled', 'expired', 'cancelled'].map(s => (
                          req.status !== s && (
                            <button key={s} onClick={() => updateStatus(req.id, s)}
                              disabled={actionLoading === req.id + s}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 capitalize ${
                                s === 'fulfilled' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' :
                                s === 'cancelled' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' :
                                s === 'contacted' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' :
                                'border-white/10 text-gray-400 hover:bg-white/5'
                              }`}>
                              {actionLoading === req.id + s ? '…' : `Mark ${s}`}
                            </button>
                          )
                        ))}
                      </div>

                      {/* Admin notes */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Admin notes</label>
                        <textarea
                          value={noteEdits[req.id] ?? req.admin_notes ?? ''}
                          onChange={e => setNoteEdits(prev => ({ ...prev, [req.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add notes about this request…"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#557d72] resize-none"
                        />
                        <button onClick={() => saveNote(req.id)} disabled={actionLoading === req.id + 'note'}
                          className="mt-1.5 px-3 py-1 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition disabled:opacity-50">
                          {actionLoading === req.id + 'note' ? 'Saving…' : 'Save note'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
