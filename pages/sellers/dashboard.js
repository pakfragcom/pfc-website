import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../lib/auth-context';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const TIER_CONFIG = {
  0: { label: 'Unverified',          cls: 'bg-white/10 text-gray-400 ring-white/15',             icon: '○' },
  1: { label: 'Community Verified',   cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25', icon: '✓' },
  2: { label: 'Document Verified',    cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',           icon: '✓' },
  3: { label: 'PakFrag Trusted',      cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',     icon: '★' },
};

const STATUS_CONFIG = {
  active:  { label: 'Active',         cls: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  pending: { label: 'Pending Review', cls: 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20' },
  grace:   { label: 'Grace Period',   cls: 'text-orange-400 bg-orange-500/10 ring-orange-500/20' },
  expired: { label: 'Expired',        cls: 'text-red-400 bg-red-500/10 ring-red-500/20' },
};

const INVENTORY_CONDITIONS = [
  { id: 'sealed',   label: 'Sealed / BNIB' },
  { id: 'partial',  label: 'Partial Bottle' },
  { id: 'decant',   label: 'Decant / Vial' },
  { id: 'gift_set', label: 'Gift Set' },
];
const INVENTORY_CONCENTRATIONS = ['EDP', 'EDT', 'EDP Intense', 'Parfum', 'EDC', 'Attar / Oil', 'Other'];

function InventoryPilotSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rowSaving, setRowSaving] = useState(null);

  const [form, setForm] = useState({
    fragrance_name: '', fragrance_id: '', house: '', size_ml: '', concentration: '',
    condition: 'sealed', stock_qty: '1', price_pkr: '', is_negotiable: false,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimeout = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/sellers/inventory');
      if (!res.ok) throw new Error('Could not load inventory');
      setItems(await res.json());
    } catch {
      setLoadError('Could not load your inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleNameChange(val) {
    setForm(f => ({ ...f, fragrance_name: val, fragrance_id: '' }));
    clearTimeout(suggestTimeout.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fragrances/search?q=${encodeURIComponent(val)}`);
        if (res.ok) { setSuggestions((await res.json()).slice(0, 8)); setShowSuggestions(true); }
      } catch {
        // best-effort autocomplete
      }
    }, 250);
  }

  function pickSuggestion(s) {
    setForm(f => ({ ...f, fragrance_name: s.name, fragrance_id: s.id, house: s.house || f.house }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.fragrance_id) { setSubmitError('Pick a fragrance from the suggestions.'); return; }
    if (!form.size_ml || Number(form.size_ml) <= 0) { setSubmitError('Enter a valid size.'); return; }
    if (!form.price_pkr || Number(form.price_pkr) <= 0) { setSubmitError('Enter a valid price.'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/sellers/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: form.fragrance_id,
          size_ml: Number(form.size_ml),
          concentration: form.concentration,
          condition: form.condition,
          stock_qty: Number(form.stock_qty) || 0,
          price_pkr: Number(form.price_pkr),
          is_negotiable: form.is_negotiable,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save this item.');
      setForm({ fragrance_name: '', fragrance_id: '', house: '', size_ml: '', concentration: '', condition: 'sealed', stock_qty: '1', price_pkr: '', is_negotiable: false });
      setShowAdd(false);
      await load();
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveRow(item, patch) {
    setRowSaving(item.id);
    try {
      const res = await fetch('/api/sellers/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...patch }),
      });
      if (res.ok) await load();
    } finally {
      setRowSaving(null);
      setEditingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Inventory <span className="text-[10px] text-sky-400 bg-sky-500/15 rounded-full px-2 py-0.5 ml-1">Beta</span></h2>
          <p className="text-xs text-gray-400 mt-0.5">Structured stock, tied to the fragrance catalog — this is what the new shop will read from.</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="text-xs bg-white/8 hover:bg-white/15 text-gray-200 px-3 py-1.5 rounded-lg transition flex-shrink-0">
          {showAdd ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 mb-4 space-y-3">
          <div className="relative">
            <label htmlFor="inv-fragrance" className="block text-xs text-gray-400 mb-1">Fragrance</label>
            <input id="inv-fragrance" type="text" value={form.fragrance_name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Start typing to search the catalog…" autoComplete="off"
              className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-white/25" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden">
                {suggestions.map(s => (
                  <button key={s.id} type="button" onMouseDown={() => pickSuggestion(s)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition">
                    <span className="text-sm text-white">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.house}</span>
                  </button>
                ))}
              </div>
            )}
            {!form.fragrance_id && (
              <p className="mt-1 text-[11px] text-gray-400">Only catalog fragrances can be added — pick one from the list.</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="inv-size" className="block text-xs text-gray-400 mb-1">Size (ml)</label>
              <input id="inv-size" type="number" min="1" max="5000" value={form.size_ml}
                onChange={e => setForm(f => ({ ...f, size_ml: e.target.value }))}
                className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/25" />
            </div>
            <div>
              <label htmlFor="inv-conc" className="block text-xs text-gray-400 mb-1">Concentration</label>
              <select id="inv-conc" value={form.concentration}
                onChange={e => setForm(f => ({ ...f, concentration: e.target.value }))}
                className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/25 appearance-none">
                <option value="">—</option>
                {INVENTORY_CONCENTRATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inv-condition" className="block text-xs text-gray-400 mb-1">Condition</label>
              <select id="inv-condition" value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/25 appearance-none">
                {INVENTORY_CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inv-stock" className="block text-xs text-gray-400 mb-1">Stock</label>
              <input id="inv-stock" type="number" min="0" value={form.stock_qty}
                onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))}
                className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/25" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label htmlFor="inv-price" className="block text-xs text-gray-400 mb-1">Price (PKR)</label>
              <input id="inv-price" type="number" min="1" value={form.price_pkr}
                onChange={e => setForm(f => ({ ...f, price_pkr: e.target.value }))}
                className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-white/25" />
            </div>
            <label className="flex items-center gap-2 pb-2.5">
              <input type="checkbox" checked={form.is_negotiable}
                onChange={e => setForm(f => ({ ...f, is_negotiable: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-gray-300">Negotiable</span>
            </label>
          </div>

          {submitError && <p className="text-xs text-red-400">{submitError}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition">
            {submitting ? 'Saving…' : 'Save item'}
          </button>
        </form>
      )}

      {loadError ? (
        <div className="text-center py-6">
          <p className="text-xs text-red-400 mb-2">{loadError}</p>
          <button onClick={load} className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition">Try again</button>
        </div>
      ) : loading ? (
        <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No inventory yet — add your first item above.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const frag = item.product_variants?.fragrances;
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{frag?.name || 'Unknown fragrance'} · {item.product_variants?.size_ml}ml{item.product_variants?.concentration ? ` ${item.product_variants.concentration}` : ''}</p>
                    <p className="text-xs text-gray-400">{frag?.house} · Rs {Number(item.price_pkr).toLocaleString()} · {item.condition} · {item.stock_qty} in stock</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : item.status === 'paused' ? 'bg-white/8 text-gray-400' : 'bg-red-500/10 text-red-400'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <button onClick={() => setEditingId(isEditing ? null : item.id)}
                    className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-2.5 py-1 rounded-lg transition flex-shrink-0">
                    {isEditing ? 'Close' : 'Edit'}
                  </button>
                </div>

                {isEditing && (
                  <InventoryRowEditor item={item} saving={rowSaving === item.id} onSave={patch => saveRow(item, patch)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InventoryRowEditor({ item, saving, onSave }) {
  const [stock, setStock] = useState(String(item.stock_qty));
  const [price, setPrice] = useState(String(item.price_pkr));

  return (
    <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
      <div>
        <label className="block text-[10px] text-gray-400 mb-1">Stock</label>
        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
          className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-2 py-1.5 text-xs text-white outline-none focus:ring-white/25" />
      </div>
      <div>
        <label className="block text-[10px] text-gray-400 mb-1">Price (PKR)</label>
        <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)}
          className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-2 py-1.5 text-xs text-white outline-none focus:ring-white/25" />
      </div>
      <button
        disabled={saving}
        onClick={() => onSave({ stock_qty: Number(stock) || 0, price_pkr: Number(price) || item.price_pkr })}
        className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        disabled={saving}
        onClick={() => onSave({ status: item.status === 'paused' ? 'active' : 'paused' })}
        className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 py-2 rounded-lg transition disabled:opacity-50">
        {item.status === 'paused' ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}

function DocUploader({ sellerId, docType, label, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [path, setPath] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/sellers/upload-doc-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, doc_type: docType, filename: file.name }),
      });
      if (!res.ok) throw new Error('Could not start upload');
      const { signedUrl, path: p } = await res.json();

      const putRes = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!putRes.ok) throw new Error('Upload failed');

      setPath(p);
      setDone(true);
      onUploaded(p);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="block cursor-pointer">
      <div className={[
        'rounded-xl border-2 border-dashed p-4 text-center transition',
        done ? 'border-emerald-500/40 bg-emerald-500/10' : error ? 'border-red-500/40 bg-red-500/5' : 'border-white/10 hover:border-white/25',
      ].join(' ')}>
        {done ? (
          <p className="text-xs text-emerald-400">✓ {label} uploaded</p>
        ) : uploading ? (
          <p className="text-xs text-gray-400">Uploading…</p>
        ) : error ? (
          <>
            <p className="text-xs text-red-400">{error}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Tap to try again</p>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-300">{label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG or PDF</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only"
        disabled={uploading || done} onChange={handle} />
    </label>
  );
}

export default function SellerDashboard() {
  const user = useUser();
  const router = useRouter();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [showL2Form, setShowL2Form] = useState(false);
  const [l2Paths, setL2Paths] = useState({ cnic_front: null, cnic_back: null, business_proof: null });
  const [l2Submitting, setL2Submitting] = useState(false);
  const [l2Done, setL2Done] = useState(false);
  const [l2Error, setL2Error] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { router.push('/auth/login?next=/sellers/dashboard'); return; }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [sellerRes, listingsRes] = await Promise.all([
        fetch('/api/sellers/my-seller'),
        fetch('/api/listings/my-listings').catch(() => ({ ok: false })),
      ]);
      if (!sellerRes.ok) throw new Error('Could not load your seller profile');
      const sellerData = await sellerRes.json();
      if (!sellerData) {
        router.push('/sellers/apply');
        return;
      }
      setSeller(sellerData);

      // Fetch stats
      const statsRes = await fetch(`/api/sellers/${sellerData.id}/stats`).catch(() => null);
      if (statsRes?.ok) setStats(await statsRes.json());

      if (listingsRes.ok) setListings(await listingsRes.json());
    } catch (err) {
      setLoadError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!seller?.code) return;
    navigator.clipboard.writeText(seller.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitL2() {
    if (!l2Paths.cnic_front) { setL2Error('CNIC front photo is required.'); return; }
    setL2Submitting(true);
    setL2Error('');
    try {
      const res = await fetch('/api/sellers/request-l2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: seller.id,
          cnic_front_path: l2Paths.cnic_front,
          cnic_back_path: l2Paths.cnic_back,
          business_proof_path: l2Paths.business_proof,
        }),
      });
      const data = await res.json();
      if (res.ok) { setL2Done(true); }
      else { setL2Error(data.error || 'Failed to submit.'); }
    } catch {
      setL2Error('Something went wrong. Please try again.');
    } finally {
      setL2Submitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (loadError || !seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-3">{loadError || 'Could not load your seller profile.'}</p>
          <button onClick={load}
            className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const tier = TIER_CONFIG[seller.verification_tier ?? 0] || TIER_CONFIG[0];
  const statusCfg = STATUS_CONFIG[seller.status] || STATUS_CONFIG.pending;

  return (
    <>
      <Head>
        <title>Seller Dashboard | PakFrag</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="mx-auto max-w-3xl">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{seller.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${tier.cls}`}>
                    {tier.icon} {tier.label}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
              {seller.slug && (
                <Link href={`/sellers/${seller.slug}`}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition">
                  View public profile →
                </Link>
              )}
            </div>

            {/* Pending notice */}
            {seller.status === 'pending' && (
              <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4">
                <p className="text-sm text-yellow-300 font-medium">Application under review</p>
                <p className="text-xs text-yellow-400/70 mt-1">We review all applications manually within 24 hours. You'll receive your verification code once approved.</p>
              </div>
            )}

            {/* Expired notice */}
            {seller.status === 'expired' && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
                <p className="text-sm text-red-400 font-medium">Subscription expired</p>
                <p className="text-xs text-red-400/70 mt-1">Contact admin to renew your subscription and reactivate your profile.</p>
              </div>
            )}

            {/* Verification code */}
            {seller.status === 'active' && seller.code && (
              <div className="mb-6 rounded-2xl border border-[#2a5c4f]/30 bg-[#2a5c4f]/10 p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Verification Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-white tracking-widest">{seller.code}</span>
                  <button onClick={copyCode}
                    className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Share this code anywhere — WhatsApp bio, posts, stories. Buyers verify you at{' '}
                  <Link href="/tools/verify-seller" className="text-[#94aea7] underline">pakfrag.com/tools/verify-seller</Link>
                </p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Trust Score', value: seller.trust_score ? `${Math.round(Number(seller.trust_score))}` : '—', sub: 'out of 100' },
                { label: 'Tier', value: `L${seller.verification_tier ?? 0}`, sub: tier.label },
                { label: 'Active Listings', value: listings.filter(l => l.status === 'active').length || '—', sub: 'on marketplace' },
                { label: 'City', value: seller.city || '—', sub: 'location' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <Link href="/sell"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition group">
                <div className="w-9 h-9 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-[#94aea7] transition">Create Listing</p>
                  <p className="text-xs text-gray-400">Post a fragrance for sale</p>
                </div>
              </Link>

              <Link href="/log-transaction"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition group">
                <div className="w-9 h-9 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-[#94aea7] transition">Log a Deal</p>
                  <p className="text-xs text-gray-400">Build your transaction history</p>
                </div>
              </Link>

              <Link href="/marketplace"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition group">
                <div className="w-9 h-9 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M17 19a1 1 0 100 2 1 1 0 000-2zm-10 0a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-[#94aea7] transition">View Marketplace</p>
                  <p className="text-xs text-gray-400">See your listings live</p>
                </div>
              </Link>

              {seller.slug && (
                <Link href={`/sellers/${seller.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition group">
                  <div className="w-9 h-9 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] flex-shrink-0">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#94aea7] transition">Public Profile</p>
                    <p className="text-xs text-gray-400">pakfrag.com/sellers/{seller.slug}</p>
                  </div>
                </Link>
              )}
            </div>

            {/* L2 upgrade */}
            {seller.status === 'active' && (seller.verification_tier ?? 0) < 2 && (
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5 mb-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25 mb-2">
                      L2 · Document Verified
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">Get document verified</h3>
                    <p className="text-xs text-gray-400 max-w-sm">
                      Upload your CNIC to earn the Document Verified badge. No extra cost — same subscription. Significantly boosts buyer confidence.
                    </p>
                  </div>
                  {!showL2Form && !l2Done && (
                    <button onClick={() => setShowL2Form(true)}
                      className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-4 py-2 rounded-lg transition flex-shrink-0">
                      Upload Documents
                    </button>
                  )}
                </div>

                {showL2Form && !l2Done && (
                  <div className="mt-5 pt-5 border-t border-white/8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <DocUploader sellerId={seller.id} docType="cnic_front" label="CNIC Front *"
                        onUploaded={p => setL2Paths(prev => ({ ...prev, cnic_front: p }))} />
                      <DocUploader sellerId={seller.id} docType="cnic_back" label="CNIC Back"
                        onUploaded={p => setL2Paths(prev => ({ ...prev, cnic_back: p }))} />
                      <DocUploader sellerId={seller.id} docType="business_proof" label="Business Proof (optional)"
                        onUploaded={p => setL2Paths(prev => ({ ...prev, business_proof: p }))} />
                    </div>
                    {l2Error && <p className="text-xs text-red-400 mb-3">{l2Error}</p>}
                    <div className="flex gap-2">
                      <button onClick={submitL2} disabled={l2Submitting || !l2Paths.cnic_front}
                        className="text-xs bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 text-sky-300 px-4 py-2 rounded-lg transition">
                        {l2Submitting ? 'Submitting…' : 'Submit for Review'}
                      </button>
                      <button onClick={() => setShowL2Form(false)}
                        className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {l2Done && (
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-xs text-emerald-400">Documents submitted. Admin will review within 24 hours.</p>
                  </div>
                )}
              </div>
            )}

            {/* Structured inventory (pilot) */}
            {seller.inventory_pilot_enabled && (
              <div className="mb-8">
                <InventoryPilotSection />
              </div>
            )}

            {/* Active listings */}
            {listings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Your Listings</h2>
                  <Link href="/sell" className="text-xs text-gray-400 hover:text-gray-300 transition">+ New listing</Link>
                </div>
                <div className="space-y-2">
                  {listings.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{l.fragrance_name}</p>
                        <p className="text-xs text-gray-400">Rs {Number(l.price_pkr).toLocaleString()} · {l.condition}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-gray-400'}`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
