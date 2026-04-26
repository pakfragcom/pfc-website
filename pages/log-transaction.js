import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/auth-context';
import { supabase as anonSupabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEM_TYPES = [
  { id: 'sealed',   label: 'Sealed / BNIB' },
  { id: 'partial',  label: 'Partial Bottle' },
  { id: 'decant',   label: 'Decant / Vial'  },
  { id: 'gift_set', label: 'Gift Set'        },
];

const OUTCOMES = [
  { id: 'success', label: 'Smooth',  desc: 'No issues at all',              color: 'emerald', symbol: '✓' },
  { id: 'issue',   label: 'Minor Issue', desc: 'Small problem, got resolved', color: 'amber',   symbol: '!' },
  { id: 'scam',    label: 'Scam / Fraud', desc: 'Major problem or fraud',    color: 'red',     symbol: '✕' },
];

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
];

const STEPS = ['Seller', 'Items', 'Rate', 'Done'];

const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function fuzzyMatch(query, name, code) {
  const q = normalize(query);
  if (!q) return false;
  if (normalize(name).includes(q) || normalize(code).includes(q)) return true;
  return q.split(' ').filter(Boolean).every(t => normalize(name).includes(t));
}

function newItem() {
  return { id: Math.random().toString(36).slice(2), fragrance_name: '', house: '', item_type: '', price_pkr: '', quantity: '1', notes: '' };
}

// ── Small components ───────────────────────────────────────────────────────────

function StepDot({ n, current }) {
  const done = current > n;
  return (
    <div className={[
      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition',
      done    ? 'bg-emerald-500 text-black'
      : current === n ? 'bg-white text-black'
      : 'bg-white/10 text-gray-500',
    ].join(' ')}>
      {done ? '✓' : n}
    </div>
  );
}

function StarRating({ label, hint, value, onChange }) {
  return (
    <div>
      <p className="text-xs font-medium text-white mb-0.5">{label}</p>
      {hint && <p className="text-[10px] text-gray-500 mb-2">{hint}</p>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? null : n)}
            className={`text-xl transition ${n <= (value || 0) ? 'text-[#94aea7]' : 'text-white/15 hover:text-white/40'}`}
          >
            ★
          </button>
        ))}
        {value && <span className="ml-1 self-center text-xs text-gray-500">{value}/5</span>}
      </div>
    </div>
  );
}

function ItemRow({ item, index, total, onChange, onRemove, fragranceSuggestions, onSearchFragrance, showSuggestions, onPickSuggestion, onHideSuggestions }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Item {index + 1}
        </p>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-600 hover:text-red-400 transition"
          >
            Remove
          </button>
        )}
      </div>

      {/* Fragrance name with autocomplete */}
      <div className="relative">
        <label className="block text-xs text-gray-400 mb-1.5">Fragrance name <span className="text-red-400">*</span></label>
        <input
          type="text"
          placeholder="e.g. Bleu de Chanel"
          value={item.fragrance_name}
          onChange={e => { onChange('fragrance_name', e.target.value); onSearchFragrance(index, e.target.value); }}
          onBlur={() => setTimeout(() => onHideSuggestions(index), 160)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
        />
        {showSuggestions && fragranceSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-white/10 bg-[#111] shadow-xl overflow-hidden">
            {fragranceSuggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => onPickSuggestion(index, s)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition"
              >
                <span className="text-sm text-white">{s.name}</span>
                <span className="text-xs text-gray-500">{s.house}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* House */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">House / Brand</label>
        <input
          type="text"
          placeholder="e.g. Chanel"
          value={item.house}
          onChange={e => onChange('house', e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
        />
      </div>

      {/* Type + Price + Qty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Type <span className="text-red-400">*</span></label>
          <select
            value={item.item_type}
            onChange={e => onChange('item_type', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
          >
            <option value="">Select…</option>
            {ITEM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Price (PKR) <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Rs</span>
            <input
              type="number"
              min="1"
              placeholder="12500"
              value={item.price_pkr}
              onChange={e => onChange('price_pkr', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
            />
          </div>
        </div>
      </div>

      {/* Qty + notes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Qty</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={e => onChange('quantity', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Item note</label>
          <input
            type="text"
            placeholder="Optional"
            value={item.notes}
            onChange={e => onChange('notes', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LogTransaction({ sellers = [] }) {
  const router = useRouter();
  const user   = useUser();

  const [step, setStep]                   = useState(1);
  const [sellerQuery, setSellerQuery]     = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [items, setItems]                 = useState([newItem()]);

  // Per-item autocomplete state
  const [suggestionMap, setSuggestionMap] = useState({}); // { itemId: suggestions[] }
  const [showMap, setShowMap]             = useState({});  // { itemId: bool }
  const suggestTimers                     = useRef({});

  // Step 3 fields
  const [outcome, setOutcome]             = useState('');
  const [city, setCity]                   = useState('');
  const [ratingDelivery, setRatingDelivery]       = useState(null);
  const [ratingAccuracy, setRatingAccuracy]       = useState(null);
  const [ratingComm, setRatingComm]               = useState(null);
  const [reviewText, setReviewText]               = useState('');
  const [notes, setNotes]                         = useState('');

  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [doneId, setDoneId]               = useState(null);

  useEffect(() => {
    if (user === null) router.replace('/auth/login?next=/log-transaction');
  }, [user]);

  // Pre-fill seller from query param
  useEffect(() => {
    if (!router.isReady || !router.query.seller) return;
    const match = sellers.find(s => s.slug === router.query.seller || s.id === router.query.seller);
    if (match) pickSeller(match);
  }, [router.isReady]);

  const filteredSellers = useMemo(() => {
    if (!sellerQuery) return [];
    return sellers.filter(s => fuzzyMatch(sellerQuery, s.name, s.code)).slice(0, 12);
  }, [sellerQuery, sellers]);

  function pickSeller(s) {
    setSelectedSeller(s);
    setSellerQuery('');
    setStep(2);
  }

  // Item field change
  function updateItem(id, field, value) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  }

  function addItem() {
    if (items.length >= 20) return;
    setItems(prev => [...prev, newItem()]);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  // Fragrance autocomplete per item
  function handleSearchFragrance(itemId, val) {
    clearTimeout(suggestTimers.current[itemId]);
    if (val.trim().length < 2) {
      setSuggestionMap(m => ({ ...m, [itemId]: [] }));
      setShowMap(m => ({ ...m, [itemId]: false }));
      return;
    }
    suggestTimers.current[itemId] = setTimeout(async () => {
      const res = await fetch(`/api/fragrances/lookup?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestionMap(m => ({ ...m, [itemId]: data.slice(0, 6) }));
        setShowMap(m => ({ ...m, [itemId]: true }));
      }
    }, 250);
  }

  function pickSuggestion(itemId, s) {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, fragrance_name: s.name, house: s.house || it.house } : it));
    setSuggestionMap(m => ({ ...m, [itemId]: [] }));
    setShowMap(m => ({ ...m, [itemId]: false }));
  }

  function hideSuggestions(itemId) {
    setShowMap(m => ({ ...m, [itemId]: false }));
  }

  // Validation for step 2
  function validateItems() {
    for (const [i, item] of items.entries()) {
      if (!item.fragrance_name.trim()) { setError(`Item ${i + 1}: fragrance name is required.`); return false; }
      if (!item.item_type)             { setError(`Item ${i + 1}: select a type.`); return false; }
      if (!item.price_pkr || Number(item.price_pkr) <= 0) { setError(`Item ${i + 1}: enter a valid price.`); return false; }
    }
    return true;
  }

  const total = useMemo(() => items.reduce((s, i) => s + (Number(i.price_pkr) || 0) * (Number(i.quantity) || 1), 0), [items]);

  async function handleSubmit() {
    if (!outcome) { setError('Please rate how the transaction went.'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/transactions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller_id:            selectedSeller.id,
        items: items.map(it => ({
          fragrance_name: it.fragrance_name,
          house:          it.house,
          item_type:      it.item_type,
          price_pkr:      Number(it.price_pkr),
          quantity:       Number(it.quantity) || 1,
          notes:          it.notes,
        })),
        outcome,
        city,
        notes,
        review_text:          reviewText,
        rating_delivery:      ratingDelivery,
        rating_accuracy:      ratingAccuracy,
        rating_communication: ratingComm,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(json.error || 'Something went wrong.'); return; }

    setDoneId(json.id);
    setStep(4);
  }

  if (!user) return null;

  // ── Step 4: Done ────────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <>
        <Head><title>Transaction Logged | PakFrag</title></Head>
        <div className="bg-black min-h-screen text-white font-sans">
          <Header />
          <main className="mx-auto max-w-xl px-4 py-28 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Transaction logged</h1>
            <p className="text-sm text-gray-400 mb-2 max-w-sm mx-auto">
              {items.length} item{items.length > 1 ? 's' : ''} · Rs {total.toLocaleString()} · {selectedSeller?.name}
            </p>
            <p className="text-xs text-gray-600 mb-8">
              Your record is now part of the community trust database.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {selectedSeller?.slug && (
                <Link href={`/sellers/${selectedSeller.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition">
                  View seller profile →
                </Link>
              )}
              <Link href="/pakistan-fragrance-index"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition">
                Price Index →
              </Link>
              <button
                onClick={() => {
                  setStep(1); setSelectedSeller(null); setSellerQuery('');
                  setItems([newItem()]); setOutcome(''); setCity(''); setNotes('');
                  setReviewText(''); setRatingDelivery(null); setRatingAccuracy(null); setRatingComm(null);
                  setError('');
                }}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-gray-400 transition"
              >
                Log another
              </button>
            </div>
            {doneId && (
              <p className="mt-6 text-xs text-gray-600">
                Something went wrong with this deal?{' '}
                <Link href={`/disputes/new?transaction_id=${doneId}`}
                  className="text-amber-500 hover:text-amber-400 transition underline underline-offset-2">
                  Report a dispute →
                </Link>
              </p>
            )}
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // ── Steps 1–3 ──────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Log a Transaction | PakFrag</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-20 sm:py-28">

          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Log Transaction</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F5F7] tracking-tight">Log a Transaction</h1>
            <p className="mt-3 text-sm text-gray-400 max-w-md">
              Record your deal with a verified seller. Add multiple items, rate the experience, and optionally write a review.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <StepDot n={n} current={step} />
                <span className={`text-xs ${step === n ? 'text-white' : 'text-gray-600'}`}>{STEPS[n - 1]}</span>
                {n < 3 && <div className="w-5 h-px bg-white/10 mx-0.5" />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Seller ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Who did you buy from?</h2>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 focus-within:border-white/25 transition">
                  <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                  </svg>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by name or code (e.g. SM-222)"
                    value={sellerQuery}
                    onChange={e => setSellerQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                    autoComplete="off"
                  />
                </div>

                {filteredSellers.length > 0 && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-[#111] overflow-hidden">
                    {filteredSellers.map(s => (
                      <button key={s.id} onClick={() => pickSeller(s)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition">
                        <div>
                          <div className="text-sm font-medium text-white">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.type === 'BNIB' ? 'BNIB' : 'Decanter'}</div>
                        </div>
                        <span className="font-mono text-xs text-gray-400">{s.code}</span>
                      </button>
                    ))}
                  </div>
                )}

                {sellerQuery && filteredSellers.length === 0 && (
                  <p className="mt-3 text-sm text-amber-400/80">
                    No verified seller found for &ldquo;{sellerQuery}&rdquo;.
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-600 text-center">
                Only verified sellers appear here.{' '}
                <Link href="/tools/verify-seller" className="text-gray-400 hover:text-white underline underline-offset-2 transition">
                  Check the registry →
                </Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Items ──────────────────────────────────────────────── */}
          {step === 2 && selectedSeller && (
            <div className="space-y-4">
              {/* Seller chip */}
              <SellerChip seller={selectedSeller} onClear={() => { setSelectedSeller(null); setStep(1); }} />

              {/* Item rows */}
              {items.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={i}
                  total={items.length}
                  onChange={(field, val) => updateItem(item.id, field, val)}
                  onRemove={() => removeItem(item.id)}
                  fragranceSuggestions={suggestionMap[item.id] || []}
                  showSuggestions={!!showMap[item.id]}
                  onSearchFragrance={(_, val) => handleSearchFragrance(item.id, val)}
                  onPickSuggestion={(_, s) => pickSuggestion(item.id, s)}
                  onHideSuggestions={() => hideSuggestions(item.id)}
                />
              ))}

              {/* Add item */}
              {items.length < 20 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-gray-500 hover:border-white/30 hover:text-gray-300 transition"
                >
                  + Add another item
                </button>
              )}

              {/* Total */}
              {total > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/8 px-5 py-3">
                  <span className="text-xs text-gray-400">{items.length} item{items.length > 1 ? 's' : ''} · Total</span>
                  <span className="text-base font-bold text-white">Rs {total.toLocaleString()}</span>
                </div>
              )}

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                onClick={() => { if (validateItems()) { setError(''); setStep(3); } }}
                className="w-full rounded-xl bg-white text-black py-3 text-sm font-semibold hover:bg-gray-100 transition"
              >
                Next: Rate the experience →
              </button>
            </div>
          )}

          {/* ── Step 3: Rate ───────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <SellerChip seller={selectedSeller} onClear={() => setStep(2)} clearLabel="← Edit items" />

              {/* Summary chip */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">{items.length} item{items.length > 1 ? 's' : ''}</span>
                <span className="text-sm font-bold text-white">Rs {total.toLocaleString()}</span>
              </div>

              {/* Outcome */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overall outcome <span className="text-red-400">*</span></h2>
                <div className="space-y-2">
                  {OUTCOMES.map(o => {
                    const active = outcome === o.id;
                    return (
                      <button key={o.id} type="button" onClick={() => setOutcome(o.id)}
                        className={[
                          'flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition',
                          active
                            ? o.color === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/10'
                              : o.color === 'amber' ? 'border-amber-500/40 bg-amber-500/10'
                              : 'border-red-500/40 bg-red-500/10'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/15',
                        ].join(' ')}>
                        <span className={[
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          o.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400'
                          : o.color === 'amber'  ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400',
                        ].join(' ')}>
                          {o.symbol}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white">{o.label}</div>
                          <div className="text-xs text-gray-400">{o.desc}</div>
                        </div>
                        {active && (
                          <span className={`ml-auto text-lg ${o.color === 'emerald' ? 'text-emerald-400' : o.color === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience ratings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Experience ratings (optional)</h2>
                <StarRating
                  label="Delivery"
                  hint="Speed and packaging quality"
                  value={ratingDelivery}
                  onChange={setRatingDelivery}
                />
                <StarRating
                  label="Item accuracy"
                  hint="Was it exactly as described?"
                  value={ratingAccuracy}
                  onChange={setRatingAccuracy}
                />
                <StarRating
                  label="Communication"
                  hint="Responsiveness and professionalism"
                  value={ratingComm}
                  onChange={setRatingComm}
                />
              </div>

              {/* Location + review */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">More details (optional)</h2>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Your city</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
                  >
                    <option value="">Select (optional)</option>
                    {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Short note</label>
                  <input
                    type="text"
                    placeholder="e.g. Fast shipping, well-packed"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Write a review</label>
                  <textarea
                    rows={4}
                    placeholder="Share your experience with the community…"
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition resize-none"
                  />
                </div>
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                onClick={handleSubmit}
                disabled={!outcome || submitting}
                className="w-full rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Submit transaction log'}
              </button>

              <button onClick={() => setStep(2)} className="w-full text-sm text-gray-500 hover:text-white transition py-1">
                ← Back to items
              </button>
            </div>
          )}

        </main>
        <Footer />
      </div>
    </>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function SellerChip({ seller, onClear, clearLabel = 'Change' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold ring-1 ring-emerald-500/30">
        {seller.name[0].toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{seller.name}</div>
        <div className="text-xs text-gray-400 font-mono">{seller.code}</div>
      </div>
      <button onClick={onClear} className="text-xs text-gray-500 hover:text-white transition shrink-0">
        {clearLabel}
      </button>
    </div>
  );
}

function ErrorMsg({ children }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
      <p className="text-sm text-red-400">{children}</p>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────

export async function getStaticProps() {
  const { data: sellers } = await anonSupabase
    .from('sellers')
    .select('id, name, code, seller_type, slug')
    .in('status', ['active', 'grace'])
    .order('name');

  return {
    props: {
      sellers: (sellers || []).map(s => ({
        id: s.id, name: s.name, code: s.code,
        type: s.seller_type, slug: s.slug || null,
      })),
    },
    revalidate: 300,
  };
}
