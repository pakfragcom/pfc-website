import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../lib/auth-context';

const EASE = [0.25, 0.46, 0.45, 0.94];

const CATEGORIES = [
  { value: 'designer',       label: 'Designer' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'niche',          label: 'Niche' },
  { value: 'local',          label: 'Local Brand' },
];

const EMPTY = {
  name: '', house: '', category: '', concentration: '',
  year_released: '', description: '', image_url: '',
  notes_top: '', notes_heart: '', notes_base: '',
};

export default function FragranceSubmit() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null); // 'found' | 'not_found' | null
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/auth/login?next=/fragrances/submit');
    }
  }, [user, mounted, router]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function autoFill() {
    if (!form.name.trim() || !form.house.trim()) return;
    setLookingUp(true);
    setLookupResult(null);
    try {
      const params = new URLSearchParams({ name: form.name.trim(), house: form.house.trim() });
      const res = await fetch(`/api/fragrances/lookup?${params}`);
      const data = await res.json();
      if (data.found) {
        setForm(f => ({
          ...f,
          image_url:     f.image_url     || data.image_url     || '',
          description:   f.description   || data.description   || '',
          concentration: f.concentration || data.concentration  || '',
          year_released: f.year_released || (data.year_released ? String(data.year_released) : ''),
        }));
        setLookupResult('found');
      } else {
        setLookupResult('not_found');
      }
    } catch {
      setLookupResult('not_found');
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/fragrances/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year_released: form.year_released ? Number(form.year_released) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !user) return null;

  if (done) {
    return (
      <>
        <Head><title>Fragrance Submitted | PFC</title></Head>
        <div className="bg-[#0a0a0a] min-h-screen text-white">
          <Header />
          <LazyMotion features={domAnimation}>
            <main className="pt-24 pb-20 flex items-center justify-center px-6">
              <m.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-md w-full text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Fragrance Submitted!</h1>
                <p className="text-gray-400 text-sm mb-8">
                  Thank you! Your fragrance will appear in the directory once it&apos;s reviewed by our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/fragrances"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2a5c4f] hover:bg-[#3d8b76] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300">
                    Browse Directory
                  </Link>
                  <button
                    onClick={() => { setForm(EMPTY); setDone(false); setLookupResult(null); }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm text-gray-300 transition"
                  >
                    Submit Another
                  </button>
                </div>
              </m.div>
            </main>
          </LazyMotion>
          <Footer />
        </div>
      </>
    );
  }

  const canAutoFill = form.name.trim().length > 1 && form.house.trim().length > 1;

  return (
    <>
      <Head>
        <title>Submit a Fragrance | PFC</title>
        <meta name="description" content="Add a fragrance to Pakistan's community fragrance directory." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Header />
        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">
            <div className="mx-auto max-w-2xl px-6">

              {/* Header */}
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }} className="mb-8">
                <Link href="/fragrances" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white transition mb-4">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Directory
                </Link>
                <h1 className="text-2xl font-bold text-white">Submit a Fragrance</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Add a fragrance to the community directory. It will appear after admin approval.
                </p>
              </m.div>

              <m.form
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.07 }}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 space-y-6"
              >
                {/* Name + House + Auto-fill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Fragrance Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={set('name')} required
                      placeholder="e.g. Bleu de Chanel EDP"
                      className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">House / Brand <span className="text-red-400">*</span></label>
                    <input type="text" value={form.house} onChange={set('house')} required
                      placeholder="e.g. Chanel"
                      className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                  </div>
                </div>

                {/* Auto-fill button */}
                {canAutoFill && (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={autoFill} disabled={lookingUp}
                      className="inline-flex items-center gap-2 rounded-full bg-[#2a5c4f]/30 hover:bg-[#2a5c4f]/50 ring-1 ring-[#2a5c4f]/50 px-4 py-2 text-xs font-medium text-[#94aea7] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {lookingUp ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Looking up…
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                          </svg>
                          Auto-fill from web
                        </>
                      )}
                    </button>
                    {lookupResult === 'found' && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Info found — review and edit below
                      </span>
                    )}
                    {lookupResult === 'not_found' && (
                      <span className="text-xs text-gray-500">No info found — fill manually</span>
                    )}
                  </div>
                )}

                {/* Category + Concentration + Year */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Category <span className="text-red-400">*</span></label>
                    <select value={form.category} onChange={set('category')} required
                      className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-white/25 transition appearance-none">
                      <option value="" disabled>Select…</option>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Concentration</label>
                    <input type="text" value={form.concentration} onChange={set('concentration')}
                      placeholder="EDP, EDT, Parfum…"
                      className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Year Released</label>
                    <input type="number" value={form.year_released} onChange={set('year_released')}
                      placeholder="e.g. 2015" min="1900" max="2030"
                      className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={3}
                    placeholder="A brief description of the fragrance…"
                    className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition resize-none" />
                </div>

                {/* Image URL + preview */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Bottle Image URL</label>
                  <div className="flex gap-3 items-start">
                    <input type="url" value={form.image_url} onChange={set('image_url')}
                      placeholder="https://…"
                      className="flex-1 bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                    {form.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                        <img src={form.image_url} alt="preview"
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-3">Fragrance Notes <span className="text-gray-600 font-normal">(comma-separated, optional)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[['notes_top', 'Top Notes'], ['notes_heart', 'Heart Notes'], ['notes_base', 'Base Notes']].map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-[11px] text-gray-500 mb-1">{label}</label>
                        <input type="text" value={form[field]} onChange={set(field)}
                          placeholder="e.g. Bergamot, Lemon"
                          className="w-full bg-black/40 ring-1 ring-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 outline-none focus:ring-white/25 transition" />
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/20 rounded-xl px-4 py-3">{error}</p>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full rounded-xl bg-[#2a5c4f] hover:bg-[#3d8b76] py-3 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Submitting…' : 'Submit Fragrance'}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  Submissions are reviewed before appearing in the directory.
                </p>
              </m.form>
            </div>
          </main>
        </LazyMotion>
        <Footer />
      </div>
    </>
  );
}
