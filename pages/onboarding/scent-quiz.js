import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../lib/auth-context';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const FAMILIES = [
  { id: 'Oud',      emoji: '🪵', desc: 'Rich, deep, resinous' },
  { id: 'Woody',    emoji: '🌲', desc: 'Cedar, sandalwood, vetiver' },
  { id: 'Fresh',    emoji: '💧', desc: 'Clean, green, ozonic' },
  { id: 'Floral',   emoji: '🌸', desc: 'Rose, jasmine, iris' },
  { id: 'Sweet',    emoji: '🍯', desc: 'Vanilla, caramel, gourmand' },
  { id: 'Spicy',    emoji: '🌶',  desc: 'Pepper, saffron, cardamom' },
  { id: 'Citrus',   emoji: '🍋', desc: 'Bergamot, lemon, neroli' },
  { id: 'Oriental', emoji: '✨', desc: 'Amber, incense, balsam' },
  { id: 'Musk',     emoji: '🌫',  desc: 'Clean, skin-like, soft' },
  { id: 'Aquatic',  emoji: '🌊', desc: 'Marine, ocean, watery' },
];

const OCCASIONS = [
  { id: 'daily',    label: 'Daily / Office',   emoji: '💼' },
  { id: 'casual',   label: 'Casual Outings',   emoji: '🚶' },
  { id: 'events',   label: 'Events / Weddings', emoji: '🎉' },
  { id: 'date',     label: 'Date Night',        emoji: '🌙' },
  { id: 'all',      label: 'All Occasions',     emoji: '♾' },
];

const BUDGETS = [
  { id: 'under_5k',  label: 'Under Rs 5,000',   sub: 'Decants & samples' },
  { id: '5k_15k',    label: 'Rs 5,000 – 15,000', sub: 'Designer range' },
  { id: '15k_30k',   label: 'Rs 15,000 – 30,000', sub: 'Premium & niche' },
  { id: 'above_30k', label: 'Rs 30,000+',        sub: 'Luxury & rare' },
];

const PAKISTAN_CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala','Other',
];

const TOTAL_STEPS = 5;

function ProgressBar({ step }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1 mb-8">
      <div
        className="bg-[#557d72] h-1 rounded-full transition-all duration-500"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );
}

function StepLabel({ current, total }) {
  return <p className="text-xs text-gray-500 mb-2">Step {current} of {total}</p>;
}

export default function ScentQuiz() {
  const router = useRouter();
  const user   = useUser();

  const [step, setStep]               = useState(1);
  const [families, setFamilies]       = useState([]);
  const [occasions, setOccasions]     = useState([]);
  const [budget, setBudget]           = useState('');
  const [city, setCity]               = useState('');
  const [currentScents, setCurrentScents] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (user === null) router.replace('/auth/login?next=/onboarding/scent-quiz');
  }, [user]);

  function toggleFamily(id) {
    setFamilies(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  function toggleOccasion(id) {
    if (id === 'all') { setOccasions(['all']); return; }
    setOccasions(prev => {
      const without = prev.filter(o => o !== 'all');
      return without.includes(id) ? without.filter(o => o !== id) : [...without, id];
    });
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/scent-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferred_families: families,
        usage_occasions: occasions,
        budget_range: budget,
        city,
        current_scents: currentScents.trim() || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to save profile');
      setSubmitting(false);
      return;
    }
    const next = router.query.next || '/u/me';
    router.push(next + '?scent=1');
  }

  if (!user) return null;

  const chipCls = (active) => [
    'flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition cursor-pointer select-none',
    active
      ? 'border-[#557d72] bg-[#557d72]/15 text-white'
      : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white',
  ].join(' ');

  return (
    <>
      <Head>
        <title>Discover Your Scent DNA | PakFrag</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="mx-auto max-w-xl px-4 py-20 sm:py-28">
          <ProgressBar step={step} />

          {/* Step 1 — Scent families */}
          {step === 1 && (
            <div>
              <StepLabel current={1} total={TOTAL_STEPS} />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">What scents appeal to you?</h1>
              <p className="text-sm text-gray-400 mb-6">Pick all that feel right — you can select multiple.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {FAMILIES.map(f => (
                  <button key={f.id} onClick={() => toggleFamily(f.id)} className={chipCls(families.includes(f.id))}>
                    <span className="text-xl mb-1">{f.emoji}</span>
                    <span className="text-sm font-semibold">{f.id}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">{f.desc}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={families.length === 0}
                className="mt-6 w-full rounded-xl bg-[#2a5c4f] hover:bg-[#557d72] disabled:opacity-40 text-white font-semibold py-3 transition text-sm"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Occasions */}
          {step === 2 && (
            <div>
              <StepLabel current={2} total={TOTAL_STEPS} />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">When do you wear fragrance?</h1>
              <p className="text-sm text-gray-400 mb-6">Select all that apply.</p>
              <div className="space-y-2.5">
                {OCCASIONS.map(o => (
                  <button key={o.id} onClick={() => toggleOccasion(o.id)}
                    className={[
                      'w-full flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-left transition',
                      occasions.includes(o.id)
                        ? 'border-[#557d72] bg-[#557d72]/15 text-white'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white',
                    ].join(' ')}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <span className="text-sm font-medium">{o.label}</span>
                    {occasions.includes(o.id) && <span className="ml-auto text-[#94aea7] text-sm">✓</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button
                  onClick={() => setStep(3)}
                  disabled={occasions.length === 0}
                  className="flex-1 rounded-xl bg-[#2a5c4f] hover:bg-[#557d72] disabled:opacity-40 text-white font-semibold py-3 transition text-sm"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Budget */}
          {step === 3 && (
            <div>
              <StepLabel current={3} total={TOTAL_STEPS} />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">What's your budget per fragrance?</h1>
              <p className="text-sm text-gray-400 mb-6">Helps us recommend things in your range.</p>
              <div className="space-y-2.5">
                {BUDGETS.map(b => (
                  <button key={b.id} onClick={() => setBudget(b.id)}
                    className={[
                      'w-full flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition',
                      budget === b.id
                        ? 'border-[#557d72] bg-[#557d72]/15 text-white'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white',
                    ].join(' ')}
                  >
                    <div>
                      <p className="text-sm font-semibold">{b.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.sub}</p>
                    </div>
                    {budget === b.id && <span className="text-[#94aea7]">✓</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!budget}
                  className="flex-1 rounded-xl bg-[#2a5c4f] hover:bg-[#557d72] disabled:opacity-40 text-white font-semibold py-3 transition text-sm"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — City */}
          {step === 4 && (
            <div>
              <StepLabel current={4} total={TOTAL_STEPS} />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">Which city are you in?</h1>
              <p className="text-sm text-gray-400 mb-6">Climate affects how fragrances perform — we'll factor this in.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PAKISTAN_CITIES.map(c => (
                  <button key={c} onClick={() => setCity(c)}
                    className={[
                      'rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                      city === c
                        ? 'border-[#557d72] bg-[#557d72]/15 text-white'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(3)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 rounded-xl bg-[#2a5c4f] hover:bg-[#557d72] text-white font-semibold py-3 transition text-sm"
                >
                  {city ? 'Continue →' : 'Skip →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Current scents + submit */}
          {step === 5 && (
            <div>
              <StepLabel current={5} total={TOTAL_STEPS} />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">What do you currently wear?</h1>
              <p className="text-sm text-gray-400 mb-6">Optional — helps fine-tune your recommendations.</p>
              <textarea
                value={currentScents}
                onChange={e => setCurrentScents(e.target.value)}
                rows={4}
                placeholder="e.g. Dior Sauvage, Arabian Oud Rose, Lattafa Oud for Glory…"
                className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-white/25 text-sm resize-none"
              />

              {error && (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(4)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">← Back</button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-[#2a5c4f] hover:bg-[#557d72] disabled:opacity-40 text-white font-semibold py-3 transition text-sm"
                >
                  {submitting ? 'Saving…' : 'Discover my DNA →'}
                </button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
