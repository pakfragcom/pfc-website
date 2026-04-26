import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '../lib/auth-context';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const CONDITIONS = [
  { id: 'sealed',   label: 'Sealed / BNIB',  hint: 'Factory sealed, never opened' },
  { id: 'partial',  label: 'Partial Bottle',  hint: 'Used, enter fill level below'  },
  { id: 'decant',   label: 'Decant / Vial',   hint: 'Decanted from a larger bottle' },
  { id: 'gift_set', label: 'Gift Set',         hint: 'Part of a gift set'            },
];

const CONCENTRATIONS = ['EDP', 'EDT', 'EDP Intense', 'Parfum', 'EDC', 'Attar / Oil', 'Other'];

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
];

export default function SellPage() {
  const router   = useRouter();
  const user     = useUser();
  const supabase = useSupabaseClient();

  const [form, setForm] = useState({
    fragrance_name: '',
    house: '',
    concentration: '',
    condition: '',
    fill_level_pct: '',
    price_pkr: '',
    is_negotiable: false,
    quantity: '1',
    city: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);
  const [doneId, setDoneId]         = useState(null);

  // Fragrance autocomplete
  const [suggestions, setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimeout = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) router.replace('/auth/login?next=/sell');
  }, [user]);

  const searchFragrances = useCallback(async (q) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    const res = await fetch(`/api/fragrances/lookup?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.slice(0, 8));
    }
  }, []);

  function handleNameChange(val) {
    setField('fragrance_name', val);
    clearTimeout(suggestTimeout.current);
    if (val.trim().length >= 2) {
      suggestTimeout.current = setTimeout(() => {
        searchFragrances(val);
        setShowSuggestions(true);
      }, 250);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function pickSuggestion(s) {
    setForm(f => ({
      ...f,
      fragrance_name: s.name,
      house: s.house || f.house,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fragrance_name.trim()) { setError('Fragrance name is required.'); return; }
    if (!form.house.trim())          { setError('Brand / house is required.'); return; }
    if (!form.condition)             { setError('Select a condition.'); return; }
    if (!form.price_pkr || Number(form.price_pkr) <= 0) { setError('Enter a valid price.'); return; }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/listings/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price_pkr:      Number(form.price_pkr),
        fill_level_pct: Number(form.fill_level_pct) || null,
        quantity:       Number(form.quantity) || 1,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (res.status === 403) {
        setError('Only verified sellers with a claimed profile can post listings. Claim your seller profile first.');
      } else {
        setError(json.error || 'Something went wrong.');
      }
      return;
    }

    setDoneId(json.id);
    setDone(true);
  }

  if (!user) return null;

  if (done) {
    return (
      <>
        <Head><title>Listing Posted | PakFrag</title></Head>
        <div className="bg-black min-h-screen text-white font-sans">
          <Header />
          <main className="mx-auto max-w-xl px-4 py-28 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Listing is live!</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
              Your listing is now visible on the marketplace. Buyers can contact you via WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {doneId && (
                <Link
                  href={`/marketplace/${doneId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition"
                >
                  View listing →
                </Link>
              )}
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition"
              >
                Browse marketplace
              </Link>
              <button
                onClick={() => {
                  setDone(false); setDoneId(null);
                  setForm({ fragrance_name: '', house: '', concentration: '', condition: '', fill_level_pct: '', price_pkr: '', is_negotiable: false, quantity: '1', city: '', description: '' });
                }}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition"
              >
                Post another
              </button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Post a Listing | PakFrag Marketplace</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-20 sm:py-28">

          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Post a Listing</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F5F7] tracking-tight">Post a Listing</h1>
            <p className="mt-3 text-sm text-gray-400 max-w-md">
              Your fragrance will appear on the marketplace for 30 days. Only verified sellers can post.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Fragrance info */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fragrance Details</h2>

              {/* Fragrance name with autocomplete */}
              <div className="relative">
                <label className="block text-xs text-gray-400 mb-1.5">Fragrance name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Sauvage Elixir"
                  value={form.fragrance_name}
                  onChange={e => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-white/10 bg-[#111] shadow-xl overflow-hidden">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => pickSuggestion(s)}
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
                <label className="block text-xs text-gray-400 mb-1.5">House / Brand <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Dior"
                  value={form.house}
                  onChange={e => setField('house', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
                />
              </div>

              {/* Concentration */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Concentration</label>
                <select
                  value={form.concentration}
                  onChange={e => setField('concentration', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
                >
                  <option value="">Select (optional)</option>
                  {CONCENTRATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </section>

            {/* Condition */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Condition <span className="text-red-400">*</span></h2>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setField('condition', c.id)}
                    className={[
                      'rounded-xl border px-3 py-3 text-left transition',
                      form.condition === c.id
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/15 hover:text-gray-200',
                    ].join(' ')}
                  >
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{c.hint}</div>
                  </button>
                ))}
              </div>

              {/* Fill level — only for partial / decant */}
              {(form.condition === 'partial' || form.condition === 'decant') && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Fill level (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="e.g. 70"
                    value={form.fill_level_pct}
                    onChange={e => setField('fill_level_pct', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
                  />
                </div>
              )}
            </section>

            {/* Pricing */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Price (PKR) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="12500"
                      value={form.price_pkr}
                      onChange={e => setField('price_pkr', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => setField('quantity', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 transition"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_negotiable}
                    onChange={e => setField('is_negotiable', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition ${form.is_negotiable ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.is_negotiable ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-300">Price is negotiable</span>
              </label>
            </section>

            {/* Location + description */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">More Details</h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Your city</label>
                <select
                  value={form.city}
                  onChange={e => setField('city', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 transition appearance-none"
                >
                  <option value="">Select city (optional)</option>
                  {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the bottle, box condition, purchase year, reason for selling, etc."
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/25 transition resize-none"
                />
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
                {error.includes('claimed') && (
                  <Link href="/u/me" className="text-xs text-red-300 underline underline-offset-2 mt-1 inline-block">
                    Go to your profile to claim a seller →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post listing →'}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Listings are active for 30 days. Buyers contact you directly via WhatsApp.
            </p>
          </form>
        </main>

        <Footer />
      </div>
    </>
  );
}
