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

function DocUploader({ sellerId, docType, label, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [path, setPath] = useState(null);
  const fileRef = useRef(null);

  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await fetch('/api/sellers/upload-doc-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: sellerId, doc_type: docType, filename: file.name }),
    });
    if (!res.ok) { setUploading(false); return; }
    const { signedUrl, path: p } = await res.json();
    await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    setPath(p);
    setDone(true);
    setUploading(false);
    onUploaded(p);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <label className="block cursor-pointer">
      <div className={[
        'rounded-xl border-2 border-dashed p-4 text-center transition',
        done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 hover:border-white/25',
      ].join(' ')}>
        {done ? (
          <p className="text-xs text-emerald-400">✓ {label} uploaded</p>
        ) : uploading ? (
          <p className="text-xs text-gray-500">Uploading…</p>
        ) : (
          <>
            <p className="text-xs text-gray-300">{label}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">JPG, PNG or PDF</p>
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

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { router.push('/auth/login?next=/sellers/dashboard'); return; }
    load();
  }, [user]);

  async function load() {
    const [sellerRes, listingsRes] = await Promise.all([
      fetch('/api/sellers/my-seller'),
      fetch('/api/listings/my-listings').catch(() => ({ ok: false })),
    ]);
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
    setLoading(false);
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
    setL2Submitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
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
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Verification Code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-white tracking-widest">{seller.code}</span>
                  <button onClick={copyCode}
                    className="text-xs bg-white/10 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3">
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
                  <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">{label}</p>
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
                  <p className="text-xs text-gray-600">Post a fragrance for sale</p>
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
                  <p className="text-xs text-gray-600">Build your transaction history</p>
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
                  <p className="text-xs text-gray-600">See your listings live</p>
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
                    <p className="text-xs text-gray-600">pakfrag.com/sellers/{seller.slug}</p>
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
                    <p className="text-xs text-gray-500 max-w-sm">
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

            {/* Active listings */}
            {listings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Your Listings</h2>
                  <Link href="/sell" className="text-xs text-gray-500 hover:text-gray-300 transition">+ New listing</Link>
                </div>
                <div className="space-y-2">
                  {listings.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{l.fragrance_name}</p>
                        <p className="text-xs text-gray-500">Rs {Number(l.price_pkr).toLocaleString()} · {l.condition}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-gray-500'}`}>
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
