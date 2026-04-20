import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '../../lib/auth-context';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);
}

const CATEGORIES = [
  { id: 'designer',       label: 'Designer' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'niche',          label: 'Niche' },
  { id: 'local',          label: 'Local Brand' },
];
const SEASONS   = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Seasons'];
const OCCASIONS = ['Daily', 'Office', 'Formal', 'Casual', 'Date Night', 'Special Occasion'];

export default function SubmitReview() {
  const router   = useRouter();
  const user     = useUser();
  const supabase = useSupabaseClient();

  // Pre-fill from query params (e.g. coming from /fragrances/[slug])
  const prefillName = router.query.fragrance || '';
  const prefillHouse = router.query.house || '';
  const prefillFid  = router.query.fid || '';

  const [form, setForm] = useState({
    fragrance_name: prefillName,
    house: prefillHouse,
    category: '',
    rating_overall: 0, rating_longevity: 0, rating_sillage: 0, rating_value: 0,
    review_text: '', occasion: '', season: '',
  });
  const [fragrance_id, setFragranceId] = useState(prefillFid || null);

  // Sync pre-fill once router is ready
  useEffect(() => {
    if (!router.isReady) return;
    if (prefillName || prefillHouse) {
      setForm(p => ({ ...p, fragrance_name: prefillName, house: prefillHouse }));
      if (prefillFid) setFragranceId(prefillFid);
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  // ── Fragrance auto-suggest ───────────────────────────────────────
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const suggestTimeout = useRef(null);
  const suggestionRef = useRef(null);

  const searchFragrances = useCallback(async (query) => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    setSuggestionLoading(true);
    const { data } = await supabase
      .from('fragrances')
      .select('id, name, house, category, concentration')
      .eq('status', 'approved')
      .ilike('name', `%${query.trim()}%`)
      .limit(8);
    setSuggestions(data || []);
    setSuggestionLoading(false);
  }, [supabase]);

  const handleFragranceNameChange = (value) => {
    set('fragrance_name', value);
    setFragranceId(null); // clear linked fragrance when user types freely
    clearTimeout(suggestTimeout.current);
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      suggestTimeout.current = setTimeout(() => searchFragrances(value), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const pickSuggestion = (frag) => {
    setForm(p => ({
      ...p,
      fragrance_name: frag.name,
      house: frag.house,
      category: frag.category || p.category,
    }));
    setFragranceId(frag.id);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auth guard ───────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2a5c4f]/20 border border-[#2a5c4f]/40 mb-5">
            <svg className="w-6 h-6 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Sign in to write a review</h1>
          <p className="text-sm text-gray-400 mb-6">Create a free PFC account to share your fragrance experiences with the community.</p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/signup?next=/reviews/submit"
              className="w-full text-center rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
              Create Account
            </Link>
            <Link href="/auth/login?next=/reviews/submit"
              className="w-full text-center rounded-xl border border-white/15 py-2.5 text-sm text-gray-300 hover:text-white transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a5c4f]/20 border border-[#2a5c4f]/40 mb-5">
            <svg className="w-7 h-7 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Review Submitted!</h1>
          <p className="text-sm text-gray-400 mb-6">
            Your review is under review by our team. It&apos;ll go live once approved — usually within 24 hours.
          </p>
          <Link href="/reviews"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-5 py-2 text-sm text-white hover:bg-white/10 transition">
            Browse Reviews
          </Link>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) { setError('Please select a category.'); return; }
    if (form.rating_overall === 0) { setError('Please give an overall rating.'); return; }
    if (form.review_text.trim().length < 80) { setError('Review must be at least 80 characters.'); return; }

    setLoading(true); setError('');

    // Ensure profile exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!profile) {
      const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const username = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20) + '-' + user.id.slice(0, 6);
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id, username, display_name: rawName, city: user.user_metadata?.city || null,
      });
      if (profileError) { setError('Could not set up your profile. Please visit your profile page first.'); setLoading(false); return; }
    }

    const slug = slugify(form.fragrance_name);
    const { error: insertError } = await supabase.from('reviews').insert({
      author_id:        user.id,
      slug,
      fragrance_name:   form.fragrance_name.trim(),
      house:            form.house.trim(),
      category:         form.category,
      fragrance_id:     fragrance_id || null,
      rating_overall:   form.rating_overall,
      rating_longevity: form.rating_longevity || null,
      rating_sillage:   form.rating_sillage   || null,
      rating_value:     form.rating_value     || null,
      review_text:      form.review_text.trim(),
      occasion:         form.occasion || null,
      season:           form.season   || null,
    });

    if (insertError) { setError(insertError.message); setLoading(false); }
    else setDone(true);
  }

  return (
    <>
      <Head>
        <title>Write a Review | PFC</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <main className="pt-24 pb-20">
          <div className="mx-auto max-w-2xl px-6">
            <div className="mb-8">
              <Link href="/reviews" className="text-sm text-gray-500 hover:text-white transition flex items-center gap-2 mb-4">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Reviews
              </Link>
              <h1 className="text-2xl font-extrabold text-white">Write a Review</h1>
              <p className="text-gray-500 text-sm mt-1">Share your honest experience with the community.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Fragrance info */}
              <Section title="Fragrance">
                {/* Fragrance name with auto-suggest */}
                <div ref={suggestionRef} className="relative">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Fragrance Name *
                    {fragrance_id && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[#94aea7]">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Linked to directory
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.fragrance_name}
                    onChange={e => handleFragranceNameChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="e.g. Sauvage EDP"
                    required
                    autoComplete="off"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition"
                  />

                  {/* Dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden">
                      {suggestionLoading ? (
                        <div className="px-4 py-3 text-xs text-gray-500">Searching…</div>
                      ) : suggestions.length > 0 ? (
                        <>
                          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-600">
                            Fragrances in directory
                          </div>
                          {suggestions.map(frag => (
                            <button
                              key={frag.id}
                              type="button"
                              onMouseDown={() => pickSuggestion(frag)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#2a5c4f]/20 border border-[#2a5c4f]/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-[#94aea7]" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2a5 5 0 015 5v1h1a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v1h6V7a3 3 0 00-3-3z"/>
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{frag.name}</p>
                                <p className="text-xs text-gray-500 truncate">{frag.house}{frag.concentration ? ` · ${frag.concentration}` : ''}</p>
                              </div>
                            </button>
                          ))}
                          <div className="px-4 py-2 border-t border-white/8 text-[11px] text-gray-600">
                            Don&apos;t see it? Continue typing to add a new fragrance.
                          </div>
                        </>
                      ) : form.fragrance_name.trim().length >= 2 && (
                        <div className="px-4 py-3 text-xs text-gray-500">
                          Not in directory yet — your review will help us add it.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="House / Brand *" value={form.house} onChange={v => set('house', v)} placeholder="e.g. Dior" required />
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(c => (
                        <button key={c.id} type="button" onClick={() => set('category', c.id)}
                          className={['px-4 py-2 rounded-full text-xs font-medium transition',
                            form.category === c.id ? 'bg-white text-black' : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white'].join(' ')}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Ratings */}
              <Section title="Ratings">
                <RatingInput label="Overall *" value={form.rating_overall} onChange={v => set('rating_overall', v)} />
                <RatingInput label="Longevity" value={form.rating_longevity} onChange={v => set('rating_longevity', v)} />
                <RatingInput label="Sillage" value={form.rating_sillage} onChange={v => set('rating_sillage', v)} />
                <RatingInput label="Value for Money" value={form.rating_value} onChange={v => set('rating_value', v)} />
              </Section>

              {/* Review text */}
              <Section title="Your Review">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Review *</label>
                  <textarea
                    value={form.review_text}
                    onChange={e => set('review_text', e.target.value)}
                    rows={8}
                    placeholder="Describe your experience — how it opens, evolves, performs, and what occasions you'd wear it for. Minimum 80 characters."
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition resize-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">{form.review_text.length} / 80 minimum</p>
                </div>
              </Section>

              {/* Context */}
              <Section title="Context (optional)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Occasion</label>
                    <select value={form.occasion} onChange={e => set('occasion', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#557d72] transition">
                      <option value="">Select</option>
                      {OCCASIONS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Season</label>
                    <select value={form.season} onChange={e => set('season', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-[#557d72] transition">
                      <option value="">Select</option>
                      {SEASONS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </Section>

              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] py-3 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 transition hover:brightness-110 disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit for Review'}
              </button>
              <p className="text-xs text-gray-600 text-center">Reviews are moderated before publishing. Usually live within 24 hours.</p>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 pb-3 border-b border-white/10">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#557d72] focus:ring-1 focus:ring-[#557d72] transition" />
    </div>
  );
}

function RatingInput({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(value === n ? 0 : n)}
            className="focus:outline-none group">
            <svg className={`h-6 w-6 transition ${n <= value ? 'text-[#94aea7]' : 'text-white/15 hover:text-white/30'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
        {value > 0 && <span className="text-xs text-gray-500 ml-1">{value}/5</span>}
      </div>
    </div>
  );
}
