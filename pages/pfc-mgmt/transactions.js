import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getServerSideProps } from '../../lib/admin-guard';
export { getServerSideProps };

const OUTCOME_CONFIG = {
  success: { label: 'Success',  cls: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  issue:   { label: 'Issue',    cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20'     },
  scam:    { label: 'Scam',     cls: 'text-red-400 bg-red-500/10 ring-red-500/20'           },
};

const DISPUTE_CONFIG = {
  none:       { label: 'None',      cls: 'text-gray-400 bg-white/5 ring-white/10'              },
  open:       { label: 'Open',      cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20'    },
  resolved:   { label: 'Resolved',  cls: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  escalated:  { label: 'Escalated', cls: 'text-red-400 bg-red-500/10 ring-red-500/20'          },
};

const CONDITION_LABEL = { sealed: 'Sealed', partial: 'Partial', decant: 'Decant', gift_set: 'Gift Set' };

const ADMIN_IDENTITY = {
  type: 'admin', displayName: 'Admin',
  permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true },
};

export default function AdminTransactions({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [loading, setLoading]           = useState(true);
  const [flaggedOnly, setFlaggedOnly]   = useState(false);
  const [expanded, setExpanded]         = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  async function load(p = page, flagged = flaggedOnly) {
    setLoading(true);
    const params = new URLSearchParams({ page: p, ...(flagged ? { flagged: '1' } : {}) });
    const res = await fetch(`/api/admin/transactions?${params}`);
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const json = await res.json();
    setTransactions(json.transactions || []);
    setTotal(json.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function patch(id, updates) {
    setActionLoading(id);
    await fetch('/api/admin/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await load();
    setActionLoading(null);
  }

  function handleFilterChange(val) {
    setFlaggedOnly(val);
    setPage(0);
    load(0, val);
  }

  function handlePage(n) {
    setPage(n);
    load(n, flaggedOnly);
  }

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/pfc-mgmt/login');
  }

  const flaggedCount = transactions.filter(t => t.flagged).length;
  const LIMIT = 50;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <Head><title>Transactions | PFC Admin</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="transactions" identity={identity} onLogout={handleLogout} />

        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Transactions</h1>
              <p className="text-sm text-gray-500 mt-0.5">{total} total logged</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleFilterChange(!flaggedOnly)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition',
                  flaggedOnly
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                ].join(' ')}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                Flagged only
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No transactions found.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => {
                const outcome  = OUTCOME_CONFIG[tx.outcome]  || OUTCOME_CONFIG.success;
                const dispute  = DISPUTE_CONFIG[tx.dispute_status] || DISPUTE_CONFIG.none;
                const isOpen   = expanded === tx.id;

                return (
                  <div key={tx.id} className={`rounded-2xl border bg-white/[0.02] overflow-hidden transition ${tx.flagged ? 'border-amber-500/25' : 'border-white/8'}`}>
                    <button
                      className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition"
                      onClick={() => setExpanded(isOpen ? null : tx.id)}
                    >
                      {tx.flagged && (
                        <span title="Flagged for review" className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs">!</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{tx.fragrance_name}</span>
                          {tx.house && <span className="text-xs text-gray-400">{tx.house}</span>}
                          <span className="text-xs text-gray-500">{CONDITION_LABEL[tx.condition] || tx.condition}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                          <span>Seller: <span className="text-gray-300">{tx.sellers?.name}</span> <span className="font-mono">({tx.sellers?.code})</span></span>
                          <span>Buyer: <span className="text-gray-300">{tx.profiles?.display_name || 'Anonymous'}</span></span>
                          {tx.city && <span>{tx.city}</span>}
                          <span>{new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Rs {tx.price_pkr?.toLocaleString()}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${outcome.cls}`}>{outcome.label}</span>
                        {tx.dispute_status !== 'none' && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${dispute.cls}`}>{dispute.label}</span>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0l-4.24-3.36a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-white/8 pt-4 space-y-4">
                        {tx.notes && (
                          <p className="text-sm text-gray-300 bg-white/5 rounded-xl px-4 py-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Notes</span>
                            {tx.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {/* Dispute status */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Dispute:</span>
                            {['none', 'open', 'resolved', 'escalated'].map(d => (
                              <button
                                key={d}
                                disabled={tx.dispute_status === d || actionLoading === tx.id}
                                onClick={() => patch(tx.id, { dispute_status: d })}
                                className={[
                                  'rounded-lg px-2.5 py-1 text-xs font-medium transition border',
                                  tx.dispute_status === d
                                    ? DISPUTE_CONFIG[d].cls + ' ring-1'
                                    : 'border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-40',
                                ].join(' ')}
                              >
                                {DISPUTE_CONFIG[d].label}
                              </button>
                            ))}
                          </div>

                          {/* Flag toggle */}
                          <button
                            disabled={actionLoading === tx.id}
                            onClick={() => patch(tx.id, { flagged: !tx.flagged })}
                            className={[
                              'rounded-lg px-3 py-1 text-xs font-medium border transition',
                              tx.flagged
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                : 'border-white/10 text-gray-400 hover:bg-white/10',
                            ].join(' ')}
                          >
                            {tx.flagged ? 'Unflag' : 'Flag'}
                          </button>

                          {/* View seller */}
                          {tx.sellers?.id && (
                            <a
                              href={`/pfc-mgmt/sellers?q=${encodeURIComponent(tx.sellers.name)}`}
                              className="rounded-lg px-3 py-1 text-xs font-medium border border-white/10 text-gray-400 hover:bg-white/10 transition"
                            >
                              View seller →
                            </a>
                          )}
                        </div>

                        {actionLoading === tx.id && (
                          <p className="text-xs text-gray-500">Saving…</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page === 0}
                onClick={() => handlePage(page - 1)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {page + 1} / {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => handlePage(page + 1)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
