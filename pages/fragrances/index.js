import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  { id: 'all',            label: 'All' },
  { id: 'designer',       label: 'Designer' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'niche',          label: 'Niche' },
  { id: 'local',          label: 'Local' },
];

const EASE = [0.25, 0.46, 0.45, 0.94];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export default function FragrancesIndex({ fragrances = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = fragrances;
    if (activeCategory !== 'all') list = list.filter(f => f.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q)
      );
    }
    return list;
  }, [fragrances, activeCategory, query]);

  return (
    <>
      <Head>
        <title>Fragrance Directory Pakistan | PFC</title>
        <meta name="description" content="Browse Pakistan's fragrance community directory — Designer, Niche, Middle Eastern, and Local fragrances with real community reviews." />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">

            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/10 mb-10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-64 w-[600px] rounded-full bg-[#2a5c4f]/12 blur-3xl" />
              </div>
              <div className="mx-auto max-w-5xl px-6 py-16 text-center relative">
                <m.span
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="inline-block mb-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400 backdrop-blur"
                >
                  Community Directory
                </m.span>
                <m.h1
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE, delay: 0.07 }}
                  className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl"
                >
                  Fragrance Directory
                  <span className="block text-2xl sm:text-3xl md:text-4xl bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent mt-1">
                    {fragrances.length} Fragrances
                  </span>
                </m.h1>
                <m.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
                  className="mt-4 text-gray-400 max-w-xl mx-auto text-sm sm:text-base"
                >
                  Every fragrance reviewed by Pakistan&apos;s community in one place.
                </m.p>
                <m.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.21 }}
                  className="mt-6"
                >
                  <Link href="/fragrances/submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#2a5c4f] hover:bg-[#3d8b76] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add a Fragrance
                  </Link>
                </m.div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl px-6">

              {/* Search + filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                  </svg>
                  <input
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search fragrances or houses…"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 text-sm text-white placeholder-gray-500 outline-none focus:ring-white/20 transition"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                      className={['px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide transition',
                        activeCategory === cat.id
                          ? 'bg-white text-black'
                          : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      ].join(' ')}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="font-medium text-white mb-1">No fragrances found</p>
                  <p className="text-sm">Try a different search or category.</p>
                </div>
              ) : (
                <m.div
                  key={activeCategory + query}
                  initial="hidden" animate="show" variants={stagger}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                >
                  {filtered.map(f => (
                    <m.div key={f.id} variants={fadeUp}>
                      <FragranceCard f={f} />
                    </m.div>
                  ))}
                </m.div>
              )}
            </div>
          </main>
        </LazyMotion>
        <Footer />
      </div>
    </>
  );
}

function FragranceCard({ f }) {
  const CATEGORY_LABELS = { designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local' };
  const stars = Math.round(f.avg_rating || 0);

  return (
    <Link href={`/fragrances/${f.slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300">
      {/* Image / placeholder */}
      <div className="relative h-36 bg-gradient-to-br from-[#2a5c4f]/20 via-black to-[#94aea7]/10 overflow-hidden">
        {f.image_url ? (
          <img src={f.image_url} alt={f.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a5 5 0 015 5v1h1a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v1h6V7a3 3 0 00-3-3z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur text-[9px] uppercase tracking-wider text-white/60 border border-white/10">
          {CATEGORY_LABELS[f.category] || f.category}
        </span>
      </div>

      <div className="p-3">
        <h2 className="font-semibold text-white text-xs leading-snug line-clamp-2 group-hover:text-white transition">
          {f.name}
        </h2>
        <p className="text-[10px] text-gray-500 mt-0.5 mb-2 line-clamp-1">{f.house}</p>

        <div className="flex items-center justify-between">
          {f.review_count > 0 ? (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`h-3 w-3 ${i < stars ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-gray-600">No reviews yet</span>
          )}
          {f.review_count > 0 && (
            <span className="text-[10px] text-gray-600">{f.review_count} review{f.review_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export async function getStaticProps() {
  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, name, slug, house, category, concentration, image_url,
      reviews!reviews_fragrance_id_fkey(rating_overall, status)
    `)
    .eq('status', 'approved')
    .order('name');

  if (error) console.error('[fragrances] fetch error:', error.message);

  const fragrances = (data || []).map(f => {
    const approvedReviews = (f.reviews || []).filter(r => r.status === 'approved');
    const avg = approvedReviews.length
      ? approvedReviews.reduce((sum, r) => sum + Number(r.rating_overall), 0) / approvedReviews.length
      : 0;
    return {
      id: f.id,
      name: f.name,
      slug: f.slug,
      house: f.house,
      category: f.category,
      concentration: f.concentration || null,
      image_url: f.image_url || null,
      review_count: approvedReviews.length,
      avg_rating: Math.round(avg * 10) / 10,
    };
  });

  return { props: { fragrances }, revalidate: 300 };
}
