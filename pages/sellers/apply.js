import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useUser } from '../../lib/auth-context';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const SELLER_TYPES = [
  { value: 'BNIB',   label: 'Brand New / Sealed', desc: 'Sell sealed, unopened bottles' },
  { value: 'DECANT', label: 'Decants',             desc: 'Split / decant service' },
  { value: 'USED',   label: 'Used / Pre-owned',    desc: 'Sell tested or used bottles' },
  { value: 'SHOP',   label: 'Shop / Retailer',     desc: 'Physical or online store' },
  { value: 'BRAND',  label: 'Local Brand',         desc: 'Own fragrance house or brand' },
];

const STEPS = ['Your Info', 'Your Story', 'Review'];

const inputCls = 'w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition';

export default function SellerApply() {
  const user = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [existingSeller, setExistingSeller] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', city: '', whatsapp: '', seller_type: '',
    bio: '', instagram: '',
  });

  // Redirect if not logged in, check for existing seller
  useEffect(() => {
    if (user === undefined) return;
    if (!user) { router.push('/auth/login?next=/sellers/apply'); return; }

    fetch('/api/sellers/my-seller')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setAlreadyApplied(true);
          setExistingSeller(data);
        }
        setChecking(false);
      });
  }, [user]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function validateStep(n) {
    if (n === 0) {
      if (!form.name.trim()) return 'Display name is required.';
      if (!form.city.trim()) return 'City is required.';
      if (!form.whatsapp.trim()) return 'WhatsApp number is required.';
      if (!form.seller_type) return 'Please select your seller type.';
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/sellers/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setDone(true);
    } else {
      setError(data.error || 'Something went wrong.');
      if (res.status === 409) {
        setAlreadyApplied(true);
        setExistingSeller(data.seller);
      }
    }
    setSubmitting(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (alreadyApplied && existingSeller) {
    return (
      <>
        <Head><title>Seller Application | PakFrag</title></Head>
        <div className="bg-black min-h-screen text-white"><Header />
          <main className="pt-24 pb-20 flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
              <div className="text-4xl mb-4">
                {existingSeller.status === 'active' ? '✓' : existingSeller.status === 'pending' ? '⏳' : '✗'}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {existingSeller.status === 'active' ? 'You\'re a verified seller' :
                 existingSeller.status === 'pending' ? 'Application under review' :
                 'Seller profile exists'}
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                {existingSeller.status === 'active'
                  ? 'Your seller profile is live and buyers can verify you.'
                  : 'Your application is being reviewed. Usually within 24 hours.'}
              </p>
              <Link href="/sellers/dashboard"
                className="inline-flex items-center gap-2 bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-medium px-6 py-2.5 rounded-xl transition text-sm">
                Go to Seller Dashboard
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Head><title>Application Submitted | PakFrag</title></Head>
        <div className="bg-black min-h-screen text-white"><Header />
          <main className="pt-24 pb-20 flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Application submitted</h1>
              <p className="text-gray-400 text-sm mb-2">
                We review all applications manually. You'll hear back within <strong className="text-white">24 hours</strong>.
              </p>
              <p className="text-gray-500 text-xs mb-8">
                Once approved, your verification code will be active and buyers can verify you at pakfrag.com/tools/verify-seller.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/sellers/dashboard"
                  className="w-full text-center bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-medium py-3 rounded-xl transition text-sm">
                  Go to Seller Dashboard
                </Link>
                <Link href="/"
                  className="w-full text-center bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
                  Back to home
                </Link>
              </div>
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
        <title>Apply to Sell on PakFrag</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="mx-auto max-w-lg">

            {/* Back */}
            <Link href="/become-a-seller" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition mb-8">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </Link>

            <h1 className="text-2xl font-bold text-white mb-1">Seller Application</h1>
            <p className="text-gray-500 text-sm mb-8">Applying as <span className="text-gray-300">{user?.email}</span></p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition',
                    i < step ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-white text-black' :
                    'bg-white/10 text-gray-600'
                  ].join(' ')}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === step ? 'text-white' : 'text-gray-600'}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/8" />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Step 0: Basic info */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Display name <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Ahmed Fragrances" className={inputCls} />
                  <p className="text-[11px] text-gray-600 mt-1">This is how buyers will see you on PakFrag.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">City <span className="text-red-400">*</span></label>
                  <input value={form.city} onChange={set('city')} placeholder="e.g. Karachi" className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">WhatsApp number <span className="text-red-400">*</span></label>
                  <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="03XXXXXXXXX" className={inputCls} type="tel" />
                  <p className="text-[11px] text-gray-600 mt-1">Buyers will contact you here. Not shown publicly without your consent.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Seller type <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {SELLER_TYPES.map(t => (
                      <button key={t.value} onClick={() => setForm(f => ({ ...f, seller_type: t.value }))}
                        className={[
                          'text-left px-4 py-3 rounded-xl border transition',
                          form.seller_type === t.value
                            ? 'border-[#557d72] bg-[#2a5c4f]/20 text-white'
                            : 'border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white',
                        ].join(' ')}>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={next}
                  className="w-full bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-medium py-3 rounded-xl transition text-sm mt-2">
                  Continue
                </button>
              </div>
            )}

            {/* Step 1: Story */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">About you / your shop</label>
                  <textarea value={form.bio} onChange={set('bio')} rows={4}
                    placeholder="Tell buyers who you are, what you sell, and what makes you trustworthy…"
                    className={inputCls + ' resize-none'} />
                  <p className="text-[11px] text-gray-600 mt-1">Shown on your public seller profile. Optional but recommended.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Instagram handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">@</span>
                    <input value={form.instagram} onChange={set('instagram')} placeholder="yourhandle"
                      className={inputCls + ' pl-8'} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setStep(0); setError(''); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
                    Back
                  </button>
                  <button onClick={next}
                    className="flex-1 bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-medium py-3 rounded-xl transition text-sm">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white mb-4">Review your application</h3>

                  {[
                    ['Name', form.name],
                    ['City', form.city],
                    ['WhatsApp', form.whatsapp],
                    ['Seller type', SELLER_TYPES.find(t => t.value === form.seller_type)?.label],
                    ['Bio', form.bio || '—'],
                    ['Instagram', form.instagram ? `@${form.instagram}` : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0 pt-0.5">{label}</span>
                      <span className="text-sm text-white">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#2a5c4f]/20 bg-[#2a5c4f]/10 p-4">
                  <p className="text-xs text-[#94aea7] leading-relaxed">
                    After approval, you'll receive a unique verification code. You'll then be invoiced Rs 500/month to keep your profile active. Your profile goes live after payment confirmation.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition text-sm">
                    Back
                  </button>
                  <button onClick={submit} disabled={submitting}
                    className="flex-1 bg-[#2a5c4f] hover:bg-[#3a7c6f] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition text-sm">
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
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
