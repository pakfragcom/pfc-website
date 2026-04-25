import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

const TYPES = [
  { id: 'bnib',    label: 'BNIB',    desc: 'Brand New In Box — sealed, unused' },
  { id: 'partial', label: 'Partial', desc: 'Used bottle with fragrance remaining' },
  { id: 'decant',  label: 'Decant',  desc: 'Small sample in a decant bottle' },
  { id: 'gift',    label: 'Gift',    desc: 'Gift-wrapped, delivered to recipient' },
];

const OCCASIONS = ['Birthday', 'Eid', 'Anniversary', 'Wedding', 'Just Because', 'Other'];
const REFERRALS = ['Facebook Group', 'Instagram', 'Friend / Word of Mouth', 'Google Search', 'Other'];

const TERMS = [
  'Prices are quoted manually — no payment is taken at this step.',
  'Our team will contact you on WhatsApp within 24 hours.',
  'Availability is not guaranteed and may vary.',
  'Orders are subject to stock availability and seller confirmation.',
];

const inputCls = 'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition';
const labelCls = 'block text-xs text-gray-400 mb-1.5';

export default function OrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [fragranceName, setFragranceName]     = useState('');
  const [fragranceId, setFragranceId]         = useState(null);
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [type, setType]                       = useState('');
  const [quantity, setQuantity]               = useState(1);
  const [budget, setBudget]                   = useState('');
  const [giftRecipient, setGiftRecipient]     = useState('');
  const [giftOccasion, setGiftOccasion]       = useState('');
  const [giftMessage, setGiftMessage]         = useState('');
  const [name, setName]                       = useState('');
  const [whatsapp, setWhatsapp]               = useState('');
  const [city, setCity]                       = useState('');
  const [referral, setReferral]               = useState('');
  const [termsChecked, setTermsChecked]       = useState(false);

  const searchTimer = useRef(null);

  useEffect(() => {
    const { fragrance, fid } = router.query;
    if (fragrance) {
      setFragranceName(fragrance);
      if (fid) setFragranceId(fid);
    }
  }, [router.query]);

  async function handleFragranceInput(val) {
    setFragranceName(val);
    setFragranceId(null);
    clearTimeout(searchTimer.current);
    if (val.length < 2) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('fragrances')
        .select('id, name, house')
        .ilike('name', `%${val}%`)
        .eq('status', 'approved')
        .limit(6);
      setSuggestions(data || []);
      setShowSuggestions(true);
    }, 300);
  }

  function pickSuggestion(f) {
    setFragranceName(`${f.name} — ${f.house}`);
    setFragranceId(f.id);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function validateStep(n) {
    if (n === 1) {
      if (!fragranceName.trim()) return 'Please enter a fragrance name.';
      if (!type) return 'Please select a type.';
    }
    if (n === 2) {
      if (!name.trim()) return 'Please enter your name.';
      if (!whatsapp.trim()) return 'Please enter your WhatsApp number.';
    }
    if (n === 3) {
      if (!termsChecked) return 'Please accept the terms to continue.';
    }
    return '';
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() { setError(''); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function submit() {
    const err = validateStep(3);
    if (err) { setError(err); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_name: fragranceName.split('—')[0].trim(),
          fragrance_id: fragranceId,
          type, quantity, budget,
          is_gift: type === 'gift',
          gift_recipient_name: giftRecipient,
          gift_occasion: giftOccasion,
          gift_message: giftMessage,
          requester_name: name,
          whatsapp, city,
          referral_source: referral,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalSteps = type === 'gift' ? 4 : 3;
  const isGift = type === 'gift';

  const steps = isGift
    ? ['Fragrance', 'Gift Details', 'Your Info', 'Confirm']
    : ['Fragrance', 'Your Info', 'Confirm'];

  const currentStepLabel = steps[step - 1];

  if (done) return <SuccessPage name={name} fragrance={fragranceName.split('—')[0].trim()} type={type} />;

  return (
    <>
      <Head>
        <title>Order Fragrances | PFC</title>
        <meta name="description" content="Request a fragrance — BNIB, partial, decant, or as a gift. PFC sources and fulfills your order." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Header />
        <main className="pt-28 pb-20">
          <div className="mx-auto max-w-lg px-6">

            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition mb-4 inline-block">← Back to PFC</Link>
              <h1 className="text-2xl font-bold text-white">Order a Fragrance</h1>
              <p className="text-sm text-gray-500 mt-1">Tell us what you want — we'll reach out on WhatsApp within 24 hours.</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition ${
                    i + 1 < step ? 'bg-[#2a5c4f] text-white' :
                    i + 1 === step ? 'bg-[#557d72] text-white ring-2 ring-[#557d72]/30' :
                    'bg-white/8 text-gray-600'
                  }`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-white' : 'text-gray-600'}`}>{label}</span>
                  {i < steps.length - 1 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-[#2a5c4f]' : 'bg-white/8'}`} />}
                </div>
              ))}
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

              {/* Step 1: Fragrance */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-white">What fragrance do you want?</h2>

                  {/* Fragrance search */}
                  <div className="relative">
                    <label className={labelCls}>Fragrance name *</label>
                    <input
                      type="text" value={fragranceName}
                      onChange={e => handleFragranceInput(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="e.g. Bleu de Chanel, Tobacco Vanille…"
                      className={inputCls}
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-[#0f0f0f] shadow-xl overflow-hidden">
                        {suggestions.map(f => (
                          <li key={f.id}>
                            <button type="button" onMouseDown={() => pickSuggestion(f)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/8 transition">
                              <span className="text-white">{f.name}</span>
                              <span className="text-gray-500 ml-2 text-xs">by {f.house}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-gray-600">Start typing to search our directory, or enter any fragrance name.</p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className={labelCls}>What are you looking for? *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {TYPES.map(t => (
                        <button key={t.id} type="button" onClick={() => setType(t.id)}
                          className={`text-left rounded-xl border px-4 py-3 transition ${
                            type === t.id
                              ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                              : 'border-white/10 bg-transparent text-gray-400 hover:border-white/20 hover:text-white'
                          }`}>
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity + budget */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Quantity</label>
                      <select value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                        className={inputCls}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Budget (optional)</label>
                      <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                        placeholder="e.g. PKR 5,000" className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 (gift only): Gift details */}
              {step === 2 && isGift && (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-white">Gift details</h2>
                  <div>
                    <label className={labelCls}>Recipient name</label>
                    <input type="text" value={giftRecipient} onChange={e => setGiftRecipient(e.target.value)}
                      placeholder="Who is this for?" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Occasion</label>
                    <div className="flex flex-wrap gap-2">
                      {OCCASIONS.map(o => (
                        <button key={o} type="button" onClick={() => setGiftOccasion(o)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition ${
                            giftOccasion === o
                              ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                              : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Gift message (optional)</label>
                    <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)}
                      rows={3} placeholder="Any personal message to include with the gift…"
                      className={inputCls + ' resize-none'} />
                  </div>
                </div>
              )}

              {/* Contact step */}
              {((step === 2 && !isGift) || (step === 3 && isGift)) && (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-white">Your contact details</h2>
                  <div>
                    <label className={labelCls}>Full name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp number *</label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      placeholder="03xx-xxxxxxx" className={inputCls} />
                    <p className="mt-1 text-xs text-gray-600">We'll only use this to confirm your order.</p>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)}
                      placeholder="Karachi, Lahore, Islamabad…" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>How did you hear about us?</label>
                    <div className="flex flex-wrap gap-2">
                      {REFERRALS.map(r => (
                        <button key={r} type="button" onClick={() => setReferral(r)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition ${
                            referral === r
                              ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                              : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm + terms step */}
              {step === totalSteps && (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-white">Review & confirm</h2>

                  {/* Summary */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2 text-sm">
                    <Row label="Fragrance" value={fragranceName.split('—')[0].trim()} />
                    <Row label="Type" value={TYPES.find(t => t.id === type)?.label} />
                    <Row label="Quantity" value={quantity} />
                    {budget && <Row label="Budget" value={budget} />}
                    {isGift && giftRecipient && <Row label="Gift for" value={giftRecipient} />}
                    {isGift && giftOccasion && <Row label="Occasion" value={giftOccasion} />}
                    <div className="border-t border-white/8 pt-2 mt-2">
                      <Row label="Name" value={name} />
                      <Row label="WhatsApp" value={whatsapp} />
                      {city && <Row label="City" value={city} />}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Terms & Conditions</p>
                    {TERMS.map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-[#557d72] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t}
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border transition ${
                      termsChecked ? 'bg-[#2a5c4f] border-[#557d72]' : 'border-white/20 bg-transparent group-hover:border-white/40'
                    }`} onClick={() => setTermsChecked(v => !v)}>
                      {termsChecked && (
                        <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-300">I have read and agree to the above terms.</span>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Navigation */}
              <div className={`mt-8 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button type="button" onClick={back}
                    className="px-5 py-2.5 rounded-xl border border-white/15 text-sm text-gray-400 hover:text-white hover:border-white/30 transition">
                    ← Back
                  </button>
                )}
                {step < totalSteps ? (
                  <button type="button" onClick={next}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] text-sm font-semibold text-white hover:brightness-110 transition">
                    Continue →
                  </button>
                ) : (
                  <button type="button" onClick={submit} disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <><Spinner /> Submitting…</> : 'Submit Request →'}
                  </button>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-600">
              Questions? Message us on{' '}
              <a href="https://www.facebook.com/groups/pakfrag" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition">Facebook</a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

function SuccessPage({ name, fragrance, type }) {
  return (
    <>
      <Head><title>Request Received | PFC</title></Head>
      <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#2a5c4f]/30 border border-[#557d72]/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Request received!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Thanks {name} — we'll reach out on WhatsApp within 24 hours to confirm your <strong className="text-white">{fragrance}</strong> ({type.toUpperCase()}) request.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/fragrances"
              className="rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
              Browse more fragrances
            </Link>
            <Link href="/"
              className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-gray-400 hover:text-white transition">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
