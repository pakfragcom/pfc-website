import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getServerSideProps } from '../../lib/admin-guard';
export { getServerSideProps };

const CATEGORY_LABELS = {
  not_received:             'Not Received',
  condition_misrepresented: 'Condition Misrepresented',
  fake:                     'Counterfeit / Fake',
  price_dispute:            'Price Dispute',
  other:                    'Other',
};

const DISPUTE_STATUS_CONFIG = {
  open:      { label: 'Open',      cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
  resolved:  { label: 'Resolved',  cls: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  escalated: { label: 'Escalated', cls: 'text-red-400 bg-red-500/10 ring-red-500/20' },
  none:      { label: 'None',      cls: 'text-gray-400 bg-white/5 ring-white/10' },
};

const ADMIN_IDENTITY = {
  type: 'admin', displayName: 'Admin',
  permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true },
};

export default function AdminDisputes({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const [disputes, setDisputes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [noteEdits, setNoteEdits]   = useState({});
  const [filterStatus, setFilterStatus] = useState('open');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/disputes');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setDisputes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function patch(id, updates) {
    setActionLoading(id);
    await fetch('/api/admin/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await load();
    setActionLoading(null);
  }

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/pfc-mgmt/login');
  }

  const filtered = filterStatus === 'all'
    ? disputes
    : disputes.filter(d => d.transactions?.dispute_status === filterStatus);

  const counts = {
    all:      disputes.length,
    open:     disputes.filter(d => d.transactions?.dispute_status === 'open').length,
    escalated: disputes.filter(d => d.transactions?.dispute_status === 'escalated').length,
    resolved: disputes.filter(d => d.transactions?.dispute_status === 'resolved').length,
  };

  return (
    <>
      <Head><title>Disputes | PFC Admin</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="disputes" identity={identity} onLogout={handleLogout} />

        <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Disputes</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {counts.open} open · {counts.escalated} escalated · {counts.resolved} resolved
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[['open','Open'], ['escalated','Escalated'], ['resolved','Resolved'], ['all','All']].map(([id, label]) => (
              <button key={id} onClick={() => setFilterStatus(id)}
                className={`px-4 py-1.5 rounded-full text-sm transition border ${
                  filterStatus === id
                    ? 'bg-white/10 text-white border-white/20'
                    : 'text-gray-500 hover:text-white border-transparent'
                }`}>
                {label}
                {counts[id] > 0 && <span className="ml-1 text-xs opacity-70">{counts[id]}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No {filterStatus === 'all' ? '' : filterStatus} disputes.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(dispute => {
                const tx       = dispute.transactions || {};
                const seller   = tx.sellers || {};
                const buyer    = dispute.profiles || {};
                const txStatus = tx.dispute_status || 'open';
                const statusCfg = DISPUTE_STATUS_CONFIG[txStatus] || DISPUTE_STATUS_CONFIG.open;
                const isOpen   = expanded === dispute.id;

                return (
                  <div key={dispute.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <button
                      className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition"
                      onClick={() => setExpanded(isOpen ? null : dispute.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/5 ring-1 ring-white/10 px-2 py-0.5 rounded-full">
                            {CATEGORY_LABELS[dispute.category] || dispute.category}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-white truncate">
                          {tx.fragrance_name || 'Transaction #' + tx.id?.slice(0, 8)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Buyer: {buyer.display_name || 'Anonymous'}
                          {buyer.city && ` · ${buyer.city}`}
                          {' · '}Seller: {seller.name || '—'}
                          {tx.price_pkr && ` · Rs ${tx.price_pkr.toLocaleString()}`}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(dispute.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <svg className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0l-4.24-3.36a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/8 px-5 py-5 space-y-5">
                        {/* Description */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Buyer's account</p>
                          <p className="text-sm text-gray-300 bg-white/5 rounded-xl px-4 py-3 whitespace-pre-wrap">
                            {dispute.description}
                          </p>
                        </div>

                        {/* Evidence */}
                        {dispute.evidence_urls?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Evidence links</p>
                            <div className="flex flex-wrap gap-2">
                              {dispute.evidence_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2 truncate max-w-xs">
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions row */}
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Dispute status */}
                          <span className="text-xs text-gray-500 mr-1">Set status:</span>
                          {['open', 'resolved', 'escalated'].map(s => (
                            <button key={s}
                              disabled={txStatus === s || actionLoading === dispute.id}
                              onClick={() => patch(dispute.id, { dispute_status: s })}
                              className={[
                                'rounded-lg px-3 py-1 text-xs font-medium border transition capitalize disabled:opacity-40',
                                s === 'resolved'  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' :
                                s === 'escalated' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' :
                                'border-white/10 text-gray-400 hover:bg-white/5',
                              ].join(' ')}
                            >
                              {s}
                            </button>
                          ))}

                          {/* Downgrade seller tier */}
                          <button
                            disabled={actionLoading === dispute.id}
                            onClick={() => {
                              if (!confirm('Downgrade this seller\'s verification tier by 1 level?')) return;
                              patch(dispute.id, { seller_tier_action: 'downgrade' });
                            }}
                            className="rounded-lg px-3 py-1 text-xs font-medium border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 transition disabled:opacity-40 ml-auto"
                          >
                            Downgrade seller tier
                          </button>

                          {/* Contact seller on WhatsApp */}
                          {seller.id && (
                            <Link
                              href={`/pfc-mgmt/sellers?q=${encodeURIComponent(seller.name || '')}`}
                              className="rounded-lg px-3 py-1 text-xs font-medium border border-white/10 text-gray-400 hover:bg-white/5 transition"
                            >
                              View seller →
                            </Link>
                          )}
                        </div>

                        {/* Resolution notes */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Resolution notes (internal)</label>
                          <textarea
                            value={noteEdits[dispute.id] ?? dispute.resolution_notes ?? ''}
                            onChange={e => setNoteEdits(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                            rows={2}
                            placeholder="Outcome, actions taken, parties contacted…"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#557d72] resize-none"
                          />
                          <button
                            onClick={() => patch(dispute.id, { resolution_notes: noteEdits[dispute.id] ?? dispute.resolution_notes ?? '' })}
                            disabled={actionLoading === dispute.id}
                            className="mt-1.5 px-3 py-1 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition disabled:opacity-40"
                          >
                            {actionLoading === dispute.id ? 'Saving…' : 'Save notes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
