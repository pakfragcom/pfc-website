import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '../../lib/auth-context';
import AdminNav from '../../components/admin/AdminNav';

const ADMIN_IDENTITY = {
  type: 'admin', displayName: 'Admin',
  permissions: { is_admin: true, can_manage_sellers: true, can_manage_houses: true, can_manage_reviews: true },
};

const STATUS_COLORS = {
  pending:  'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  active:   'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/10 ring-red-500/20',
  sold:     'text-gray-400 bg-white/5 ring-white/10',
  expired:  'text-gray-600 bg-white/3 ring-white/8',
};

const TIER_BADGE = {
  0: 'bg-white/10 text-gray-400',
  1: 'bg-emerald-500/15 text-emerald-400',
  2: 'bg-sky-500/15 text-sky-400',
  3: 'bg-amber-500/15 text-amber-400',
};

const CONDITIONS = [
  { id: 'sealed',   label: 'Sealed / BNIB' },
  { id: 'partial',  label: 'Partial Bottle' },
  { id: 'decant',   label: 'Decant / Vial' },
  { id: 'gift_set', label: 'Gift Set' },
];
const CONCENTRATIONS = ['EDP', 'EDT', 'EDP Intense', 'Parfum', 'EDC', 'Attar / Oil', 'Other'];

const inputCls = 'w-full bg-black/40 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:ring-white/20 transition';

export default function AdminListings({ identity = ADMIN_IDENTITY }) {
  const router  = useRouter();
  const supabase = useSupabaseClient();

  const [listings, setListings]     = useState([]);
  const [sellers, setSellers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('pending');
  const [expanded, setExpanded]     = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [addForm, setAddForm] = useState({
    seller_id: '', fragrance_name: '', house: '', concentration: '',
    condition: 'sealed', fill_level_pct: '', price_pkr: '', is_negotiable: false,
    quantity: '1', city: '', description: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError]     = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/listings?status=${filter}`);
    if (res.status === 401) { router.push('/pfc-mgmt/login'); return; }
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadSellers() {
    const res = await fetch('/api/admin/sellers');
    if (res.ok) {
      const data = await res.json();
      setSellers((data || []).filter(s => s.status === 'active' || s.status === 'grace'));
    }
  }

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadSellers(); }, []);

  async function handleLogout() {
    if (identity?.type === 'admin') await fetch('/api/admin/auth', { method: 'DELETE' });
    else await supabase.auth.signOut();
    router.push('/pfc-mgmt/login');
  }

  async function updateStatus(id, status, reason) {
    setActionLoading(id);
    await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reject_reason: reason || null }),
    });
    await load();
    setExpanded(null);
    setRejectReason('');
    setActionLoading(null);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setAddError('');
    if (!addForm.seller_id) { setAddError('Select a seller.'); return; }
    if (!addForm.fragrance_name.trim()) { setAddError('Fragrance name required.'); return; }
    if (!addForm.house.trim()) { setAddError('House required.'); return; }
    if (!addForm.price_pkr || Number(addForm.price_pkr) <= 0) { setAddError('Valid price required.'); return; }

    setAddLoading(true);
    const res = await fetch('/api/admin/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        price_pkr: Number(addForm.price_pkr),
        quantity: Number(addForm.quantity) || 1,
        fill_level_pct: Number(addForm.fill_level_pct) || null,
      }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(data.error || 'Failed.'); return; }
    setShowAddForm(false);
    setAddForm({ seller_id: '', fragrance_name: '', house: '', concentration: '', condition: 'sealed', fill_level_pct: '', price_pkr: '', is_negotiable: false, quantity: '1', city: '', description: '' });
    if (filter === 'active') load();
  }

  function setAdd(k, v) { setAddForm(f => ({ ...f, [k]: v })); }

  const FILTERS = ['pending', 'active', 'rejected', 'sold', 'all'].map(s => ({
    id: s, label: s === 'all' ? `All (${listings.length})` : s.charAt(0).toUpperCase() + s.slice(1),
  }));

  const PAKISTAN_CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala'];

  return (
    <>
      <Head>
        <title>Listings Queue | PFC Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav currentPage="listings" identity={identity} onLogout={handleLogout} />

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Marketplace Listings</h1>
              <p className="text-xs text-gray-500 mt-1">Review seller submissions before they go live.</p>
            </div>
            <button onClick={() => setShowAddForm(v => !v)}
              className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-4 py-2 rounded-lg transition">
              + Add manually
            </button>
          </div>

          {/* Manual add form */}
          {showAddForm && (
            <form onSubmit={submitAdd}
              className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white mb-2">Add listing on behalf of seller</h2>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Seller <span className="text-red-400">*</span></label>
                <select value={addForm.seller_id} onChange={e => setAdd('seller_id', e.target.value)}
                  className={inputCls + ' appearance-none'}>
                  <option value="">Select verified seller…</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) — L{s.verification_tier ?? 0}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Fragrance name *</label>
                  <input value={addForm.fragrance_name} onChange={e => setAdd('fragrance_name', e.target.value)} placeholder="Sauvage EDP" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">House / Brand *</label>
                  <input value={addForm.house} onChange={e => setAdd('house', e.target.value)} placeholder="Dior" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Concentration</label>
                  <select value={addForm.concentration} onChange={e => setAdd('concentration', e.target.value)} className={inputCls + ' appearance-none'}>
                    <option value="">—</option>
                    {CONCENTRATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Condition *</label>
                  <select value={addForm.condition} onChange={e => setAdd('condition', e.target.value)} className={inputCls + ' appearance-none'}>
                    {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                {(addForm.condition === 'partial' || addForm.condition === 'decant') && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Fill level (%)</label>
                    <input type="number" min="1" max="99" value={addForm.fill_level_pct} onChange={e => setAdd('fill_level_pct', e.target.value)} placeholder="70" className={inputCls} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Price (PKR) *</label>
                  <input type="number" min="1" value={addForm.price_pkr} onChange={e => setAdd('price_pkr', e.target.value)} placeholder="12500" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Quantity</label>
                  <input type="number" min="1" value={addForm.quantity} onChange={e => setAdd('quantity', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">City</label>
                  <select value={addForm.city} onChange={e => setAdd('city', e.target.value)} className={inputCls + ' appearance-none'}>
                    <option value="">—</option>
                    {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="neg" checked={addForm.is_negotiable} onChange={e => setAdd('is_negotiable', e.target.checked)} className="rounded" />
                <label htmlFor="neg" className="text-xs text-gray-400">Price negotiable</label>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Description</label>
                <textarea value={addForm.description} onChange={e => setAdd('description', e.target.value)} rows={2} placeholder="Bottle condition, purchase year, etc." className={inputCls + ' resize-none'} />
              </div>

              {addError && <p className="text-xs text-red-400">{addError}</p>}

              <div className="flex gap-2">
                <button type="submit" disabled={addLoading}
                  className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 disabled:opacity-50 text-emerald-300 px-4 py-2 rounded-lg transition">
                  {addLoading ? 'Adding…' : 'Add & publish'}
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setAddError(''); }}
                  className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={['text-xs px-3 py-1.5 rounded-lg font-medium transition',
                  filter === f.id ? 'bg-white text-black' : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white'].join(' ')}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm py-10 text-center">Loading…</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">No {filter !== 'all' ? filter : ''} listings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(listing => (
                <div key={listing.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-white">
                            {listing.fragrance_name}
                            {listing.concentration ? ` ${listing.concentration}` : ''}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {listing.house} · {CONDITIONS.find(c => c.id === listing.condition)?.label || listing.condition}
                            {listing.fill_level_pct ? ` · ${listing.fill_level_pct}%` : ''}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${STATUS_COLORS[listing.status] || ''}`}>
                          {listing.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        <span className="font-medium text-white">Rs {Number(listing.price_pkr).toLocaleString()}</span>
                        {listing.is_negotiable && <span className="text-gray-600">· negotiable</span>}
                        {listing.city && <span>· {listing.city}</span>}
                        {listing.sellers && (
                          <span className="flex items-center gap-1">
                            · {listing.sellers.name}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ring-1 ${TIER_BADGE[listing.sellers.verification_tier ?? 0] || TIER_BADGE[0]} ring-white/10`}>
                              L{listing.sellers.verification_tier ?? 0}
                            </span>
                            <span className="font-mono text-gray-600">{listing.sellers.code}</span>
                          </span>
                        )}
                        <span>· {new Date(listing.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <button onClick={() => setExpanded(expanded === listing.id ? null : listing.id)}
                        className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition">
                        {expanded === listing.id ? 'Collapse' : 'Details'}
                      </button>
                      {listing.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(listing.id, 'active')}
                            disabled={actionLoading === listing.id}
                            className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                            Approve
                          </button>
                          <button onClick={() => setExpanded(`reject-${listing.id}`)}
                            disabled={actionLoading === listing.id}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {listing.status === 'active' && (
                        <button onClick={() => updateStatus(listing.id, 'expired')}
                          disabled={actionLoading === listing.id}
                          className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {expanded === listing.id && (
                    <div className="px-5 pb-5 border-t border-white/8 pt-4">
                      {listing.description ? (
                        <p className="text-sm text-gray-300 leading-relaxed">{listing.description}</p>
                      ) : (
                        <p className="text-xs text-gray-600 italic">No description provided.</p>
                      )}
                      {listing.reject_reason && (
                        <p className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                          Reject reason: {listing.reject_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reject input */}
                  {expanded === `reject-${listing.id}` && (
                    <div className="px-5 pb-5 border-t border-white/8 pt-4">
                      <label className="block text-xs text-gray-400 mb-2">Reason for rejection (shown to seller)</label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="e.g. Price appears significantly above market. Please revise."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition resize-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => updateStatus(listing.id, 'rejected', rejectReason)}
                          disabled={actionLoading === listing.id}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition disabled:opacity-50">
                          Confirm Reject
                        </button>
                        <button onClick={() => { setExpanded(null); setRejectReason(''); }}
                          className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-lg transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export { getServerSideProps } from '../../lib/admin-guard';
