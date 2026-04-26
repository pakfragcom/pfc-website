import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNav from '../../components/admin/AdminNav';
import { getServerSideProps } from '../../lib/admin-guard';
export { getServerSideProps };

const TYPE_LABELS = { bnib: 'BNIB', partial: 'Partial', decant: 'Decant', gift: 'Gift' };
const TYPE_COLORS = {
  bnib:    'text-sky-400 bg-sky-500/10 ring-sky-500/20',
  partial: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  decant:  'text-purple-400 bg-purple-500/10 ring-purple-500/20',
  gift:    'text-pink-400 bg-pink-500/10 ring-pink-500/20',
};
const STATUS_COLORS = {
  pending:   'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  contacted: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
  fulfilled: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  cancelled: 'text-red-400 bg-red-500/10 ring-red-500/20',
};
const FILTERS = ['pending', 'contacted', 'fulfilled', 'cancelled', 'all'];

const ADMIN_IDENTITY = { type: 'admin', displayName: 'Admin', permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true } };

export default function AdminOrders({ identity = ADMIN_IDENTITY }) {
  const router = useRouter();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('pending');
  const [expanded, setExpanded]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [noteEdits, setNoteEdits]   = useState({});

  async function load() {
    const res = await fetch('/api/admin/orders');
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    setActionLoading(id + status);
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
    setActionLoading(null);
  }

  async function saveNote(id) {
    setActionLoading(id + 'note');
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_notes: noteEdits[id] ?? '' }),
    });
    await load();
    setActionLoading(null);
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? orders.length : orders.filter(o => o.status === f).length;
    return acc;
  }, {});

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/pfc-mgmt/login');
  }

  return (
    <>
      <Head><title>Orders | PFC Admin</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="orders" identity={identity} onLogout={handleLogout} />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Order Requests</h1>
              <p className="text-sm text-gray-500 mt-0.5">{counts.pending} pending · {counts.fulfilled} fulfilled</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm capitalize transition ${
                  filter === f
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-500 hover:text-white border border-transparent'
                }`}>
                {f} {counts[f] > 0 && <span className="ml-1 text-xs opacity-70">{counts[f]}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No {filter === 'all' ? '' : filter} orders.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(order => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${TYPE_COLORS[order.type] || ''}`}>
                          {TYPE_LABELS[order.type] || order.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                        {order.is_gift && (
                          <span className="text-xs text-pink-400">🎁 Gift</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{order.fragrance_name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.requester_name} · {order.whatsapp}
                        {order.city && ` · ${order.city}`}
                        {order.quantity > 1 && ` · Qty: ${order.quantity}`}
                        {order.budget && ` · Budget: ${order.budget}`}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-xs text-gray-500 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
                        {expanded === order.id ? 'Collapse' : 'Details'}
                      </button>
                      <a href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 text-center">
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {expanded === order.id && (
                    <div className="border-t border-white/8 px-5 py-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <InfoCell label="Referral" value={order.referral_source} />
                        {order.is_gift && <>
                          <InfoCell label="Gift for" value={order.gift_recipient_name} />
                          <InfoCell label="Occasion" value={order.gift_occasion} />
                          {order.gift_message && (
                            <div className="col-span-2 sm:col-span-3">
                              <InfoCell label="Gift message" value={order.gift_message} />
                            </div>
                          )}
                        </>}
                      </div>

                      {/* Status actions */}
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'contacted', 'fulfilled', 'cancelled'].map(s => (
                          order.status !== s && (
                            <button key={s} onClick={() => updateStatus(order.id, s)}
                              disabled={actionLoading === order.id + s}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 capitalize ${
                                s === 'fulfilled' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' :
                                s === 'cancelled' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' :
                                s === 'contacted' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' :
                                'border-white/10 text-gray-400 hover:bg-white/5'
                              }`}>
                              {actionLoading === order.id + s ? '…' : `Mark ${s}`}
                            </button>
                          )
                        ))}
                      </div>

                      {/* Admin notes */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Admin notes</label>
                        <textarea
                          value={noteEdits[order.id] ?? order.admin_notes ?? ''}
                          onChange={e => setNoteEdits(prev => ({ ...prev, [order.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add notes about this order…"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#557d72] resize-none"
                        />
                        <button onClick={() => saveNote(order.id)} disabled={actionLoading === order.id + 'note'}
                          className="mt-1.5 px-3 py-1 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition disabled:opacity-50">
                          {actionLoading === order.id + 'note' ? 'Saving…' : 'Save note'}
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

function InfoCell({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-gray-600 uppercase tracking-wider text-[10px] mb-0.5">{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}
