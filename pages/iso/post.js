import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';

const TYPES = [
  { id: 'bnib',    label: 'BNIB',    desc: 'Brand New In Box — sealed, unused' },
  { id: 'partial', label: 'Partial', desc: 'Used bottle with fragrance remaining' },
  { id: 'decant',  label: 'Decant',  desc: 'Small sample in a decant bottle' },
];

const FILL_LEVELS = [
  { id: 'high', label: 'High',  desc: '75%+ remaining' },
  { id: 'mid',  label: 'Mid',   desc: 'Around half remaining' },
  { id: 'low',  label: 'Low',   desc: 'A quarter or less remaining' },
];

const DECANT_PRESETS = ['5ml', '10ml', '20ml'];

const inputCls = 'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition';
const labelCls = 'block text-xs text-gray-400 mb-1.5';

export default function PostIso() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [fragranceName, setFragranceName]     = useState('');
  const [fragranceId, setFragranceId]         = useState(null);
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [type, setType]                       = useState('');
  const [fillLevel, setFillLevel]             = useState('');
  const [decantPreset, setDecantPreset]       = useState('');
  const [decantCustom, setDecantCustom]       = useState('');
  const [notes, setNotes]                     = useState('');
  const [name, setName]                       = useState('');
  const [whatsapp, setWhatsapp]               = useState('');

  const searchTimer = useRef(null);
  const stepHeadingRef = useRef(null);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

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

  const hasDetailsStep = type === 'partial' || type === 'decant';
  const decantAmount = decantPreset === 'other' ? decantCustom.trim() : decantPreset;

  function validateStep(n) {
    if (n === 1) {
      if (!fragranceName.trim()) return 'Please enter a fragrance name.';
      if (!type) return 'Please select what you\'re looking for.';
    }
    if (hasDetailsStep && n === 2) {
      if (type === 'partial' && !fillLevel) return 'Please select a fill level.';
      if (type === 'decant' && !decantAmount) return 'Please select or enter an amount.';
    }
    const contactStep = hasDetailsStep ? 3 : 2;
    if (n === contactStep) {
      if (!name.trim()) return 'Please enter your name.';
      if (!whatsapp.trim()) return 'Please enter your WhatsApp number.';
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
    const err = validateStep(totalSteps);
    if (err) { setError(err); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/iso/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_name: fragranceName.split('—')[0].trim(),
          fragrance_id: fragranceId,
          type,
          fill_level: type === 'partial' ? fillLevel : null,
          decant_amount: type === 'decant' ? decantAmount : null,
          notes,
          requester_name: name,
          whatsapp,
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

  const totalSteps = hasDetailsStep ? 4 : 3;
  const steps = hasDetailsStep
    ? ['Fragrance', 'Details', 'Your Info', 'Confirm']
    : ['Fragrance', 'Your Info', 'Confirm'];
  const contactStep = hasDetailsStep ? 3 : 2;

  if (done) return <SuccessPage name={name} fragrance={fragranceName.split('—')[0].trim()} />;

  return (
    <>
      <Head>
        <title>Post an ISO | PFC</title>
        <meta name="description" content="Tell us what fragrance you're looking for — BNIB, partial, or decant. No account needed." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Header />
        <main className="pt-28 pb-20">
          <div className="mx-auto max-w-lg px-6">

            <div className="mb-8">
              <Link href="/iso" className="text-xs text-gray-400 hover:text-gray-300 transition mb-4 inline-block">← Back</Link>
              <h1 className="text-2xl font-bold text-white">Post an ISO</h1>
              <p className="text-sm text-gray-400 mt-1">Tell us what you're looking for — no account needed, just your WhatsApp.</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition ${
                    i + 1 < step ? 'bg-[#2a5c4f] text-white' :
                    i + 1 === step ? 'bg-[#557d72] text-white ring-2 ring-[#557d72]/30' :
                    'bg-white/8 text-gray-400'
                  }`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                  {i < steps.length - 1 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-[#2a5c4f]' : 'bg-white/8'}`} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

              {/* Step 1: Fragrance + type */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-base font-semibold text-white">What are you looking for?</h2>

                  <div className="relative">
                    <label htmlFor="iso-fragrance-name" className={labelCls}>Fragrance name *</label>
                    <input
                      id="iso-fragrance-name"
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
                              <span className="text-gray-400 ml-2 text-xs">by {f.house}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Start typing to search our directory, or enter any fragrance name.</p>
                  </div>

                  <div>
                    <label id="iso-type-label" className={labelCls}>Condition *</label>
                    <div role="radiogroup" aria-labelledby="iso-type-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TYPES.map(t => (
                        <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)}
                          className={`text-left rounded-xl border px-4 py-3 transition ${
                            type === t.id
                              ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                              : 'border-white/10 bg-transparent text-gray-400 hover:border-white/20 hover:text-white'
                          }`}>
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details (partial fill level / decant amount) + notes */}
              {step === 2 && hasDetailsStep && (
                <div className="space-y-6">
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-base font-semibold text-white">A few more details</h2>

                  {type === 'partial' && (
                    <div>
                      <label id="iso-fill-label" className={labelCls}>Fill level *</label>
                      <div role="radiogroup" aria-labelledby="iso-fill-label" className="grid grid-cols-3 gap-3">
                        {FILL_LEVELS.map(f => (
                          <button key={f.id} type="button" role="radio" aria-checked={fillLevel === f.id} onClick={() => setFillLevel(f.id)}
                            className={`text-center rounded-xl border px-3 py-3 transition ${
                              fillLevel === f.id
                                ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                                : 'border-white/10 bg-transparent text-gray-400 hover:border-white/20 hover:text-white'
                            }`}>
                            <p className="text-sm font-semibold">{f.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'decant' && (
                    <div>
                      <label id="iso-decant-label" className={labelCls}>Amount *</label>
                      <div role="radiogroup" aria-labelledby="iso-decant-label" className="flex flex-wrap gap-2">
                        {DECANT_PRESETS.map(d => (
                          <button key={d} type="button" role="radio" aria-checked={decantPreset === d} onClick={() => setDecantPreset(d)}
                            className={`px-4 py-2 rounded-full text-xs border transition ${
                              decantPreset === d
                                ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                            }`}>
                            {d}
                          </button>
                        ))}
                        <button type="button" role="radio" aria-checked={decantPreset === 'other'} onClick={() => setDecantPreset('other')}
                          className={`px-4 py-2 rounded-full text-xs border transition ${
                            decantPreset === 'other'
                              ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                              : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}>
                          Other
                        </button>
                      </div>
                      {decantPreset === 'other' && (
                        <input
                          type="text"
                          value={decantCustom}
                          onChange={e => setDecantCustom(e.target.value)}
                          placeholder="e.g. 15ml"
                          className={inputCls + ' mt-3'}
                          aria-label="Custom decant amount"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="iso-notes" className={labelCls}>Anything else? (optional)</label>
                    <textarea id="iso-notes" value={notes} onChange={e => setNotes(e.target.value)}
                      rows={3} placeholder="Batch code preferences, box condition, price range, etc."
                      className={inputCls + ' resize-none'} />
                  </div>
                </div>
              )}

              {/* Contact step */}
              {step === contactStep && (
                <div className="space-y-6">
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-base font-semibold text-white">Your contact details</h2>
                  <div>
                    <label htmlFor="iso-name" className={labelCls}>Full name *</label>
                    <input id="iso-name" type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="iso-whatsapp" className={labelCls}>WhatsApp number *</label>
                    <input id="iso-whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      placeholder="03xx-xxxxxxx" className={inputCls} />
                    <p className="mt-1 text-xs text-gray-400">This is only shared with our team, never posted publicly. We'll reach out if there's a match.</p>
                  </div>
                  {!hasDetailsStep && (
                    <div>
                      <label htmlFor="iso-notes-bnib" className={labelCls}>Anything else? (optional)</label>
                      <textarea id="iso-notes-bnib" value={notes} onChange={e => setNotes(e.target.value)}
                        rows={3} placeholder="Box condition, price range, etc."
                        className={inputCls + ' resize-none'} />
                    </div>
                  )}
                </div>
              )}

              {/* Confirm */}
              {step === totalSteps && (
                <div className="space-y-6">
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-base font-semibold text-white">Review & confirm</h2>
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2 text-sm">
                    <Row label="Fragrance" value={fragranceName.split('—')[0].trim()} />
                    <Row label="Condition" value={TYPES.find(t => t.id === type)?.label} />
                    {type === 'partial' && fillLevel && <Row label="Fill level" value={FILL_LEVELS.find(f => f.id === fillLevel)?.label} />}
                    {type === 'decant' && decantAmount && <Row label="Amount" value={decantAmount} />}
                    {notes && <Row label="Notes" value={notes} />}
                    <div className="border-t border-white/8 pt-2 mt-2">
                      <Row label="Name" value={name} />
                      <Row label="WhatsApp" value={whatsapp} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your contact info goes to our team only — it's never shown publicly. We'll reach out on WhatsApp if we find a match.
                  </p>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

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
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50">
                    {submitting ? 'Submitting…' : 'Post ISO →'}
                  </button>
                )}
              </div>
            </div>
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
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}

function SuccessPage({ name, fragrance }) {
  return (
    <>
      <Head><title>ISO Posted | PFC</title></Head>
      <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#2a5c4f]/30 border border-[#557d72]/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ISO posted!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Thanks {name} — your request for <strong className="text-white">{fragrance}</strong> is in. We'll reach out on WhatsApp if we find a match.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/iso/explore"
              className="rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
              See what others are looking for
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
