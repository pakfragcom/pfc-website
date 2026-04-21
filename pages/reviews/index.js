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
  { id: 'local',          label: 'Local Brands' },
];

const CATEGORY_LABELS = {
  designer:       'Designer',
  middle_eastern: 'Middle Eastern',
  niche:          'Niche',
  local:          'Local Brand',
};

const EASE = [0.25, 0.46, 0.45, 0.94];

export default function Reviews({ reviews = [], featured = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categoryCounts = useMemo(() => {
    const counts = {};
    reviews.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, [reviews]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return reviews;
    return reviews.filter(r => r.category === activeCategory);
  }, [reviews, activeCategory]);

  const filteredFeatured = useMemo(() => {
    if (activeCategory === 'all') return featured;
    return featured.filter(r => r.category === activeCategory);
  }, [featured, activeCategory]);

  return (
    <>
      <Head>
        <title>Community Reviews | PFC</title>
        <meta name="description" content="Fragrance reviews from Pakistan's community — real opinions on Designer, Niche, Middle Eastern, and Local fragrances." />
        <link rel="canonical" href="https://pakfrag.com/reviews" />
        <meta property="og:title" content="Community Reviews | PFC" />
        <meta property="og:description" content="Fragrance reviews from Pakistan's community — real opinions on Designer, Niche, Middle Eastern, and Local fragrances." />
        <meta property="og:url" content="https://pakfrag.com/reviews" />
        <meta property="og:type" content="website" />
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
                  Community Reviews
                </m.span>
                <m.h1
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE, delay: 0.07 }}
                  className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl"
                >
                  What Pakistan Is Wearing
                  <span className="block text-2xl sm:text-3xl md:text-4xl bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent mt-1">
                    {reviews.length} Reviews
                  </span>
                </m.h1>
                <m.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
                  className="mt-4 text-gray-400 max-w-xl mx-auto text-sm sm:text-base"
                >
                  Real opinions from the Pakistani fragrance community.
                </m.p>
                <m.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.21 }}
                  className="mt-6 flex items-center justify-center gap-3 flex-wrap"
                >
                  <Link href="/reviews/submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#2a5c4f] hover:bg-[#3d8b76] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Write a Review
                  </Link>
                  <Link href="/fragrances"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:border-white/30 transition">
                    Browse Fragrances
                  </Link>
                </m.div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl px-6">

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-10">
                {CATEGORIES.map(cat => {
                  const count = cat.id === 'all' ? reviews.length : (categoryCounts[cat.id] || 0);
                  return (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                      className={['px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wide transition',
                        activeCategory === cat.id
                          ? 'bg-white text-black'
                          : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      ].join(' ')}>
                      {cat.label} <span className={activeCategory === cat.id ? 'text-black/50' : 'text-gray-600'}>({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Featured spotlight */}
              {filteredFeatured.length > 0 && (
                <m.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="mb-12"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="h-px flex-1 bg-white/8" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#94aea7] flex items-center gap-1.5">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Featured
                    </span>
                    <span className="h-px flex-1 bg-white/8" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFeatured.map(review => (
                      <ReviewCard key={review.id} review={review} featured />
                    ))}
                  </div>
                </m.div>
              )}

              {/* All reviews */}
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="font-medium text-white mb-1">No reviews yet in this category</p>
                  <p className="text-sm mb-6">Be the first to review a fragrance.</p>
                  <Link href="/reviews/submit"
                    className="inline-flex items-center rounded-full bg-[#2a5c4f] hover:bg-[#3d8b76] px-6 py-2.5 text-sm font-semibold text-white transition">
                    Write a Review
                  </Link>
                </div>
              ) : (
                <>
                  {filteredFeatured.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="h-px flex-1 bg-white/8" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">All Reviews</span>
                      <span className="h-px flex-1 bg-white/8" />
                    </div>
                  )}
                  <m.div
                    key={activeCategory}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden" animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } }}
                  >
                    {filtered.map(review => (
                      <m.div key={review.id}
                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}>
                        <ReviewCard review={review} />
                      </m.div>
                    ))}
                  </m.div>
                </>
              )}
            </div>
          </main>
        </LazyMotion>
        <Footer />
      </div>
    </>
  );
}

function ReviewCard({ review, featured = false }) {
  const stars = Math.round(review.rating_overall);
  return (
    <Link href={`/reviews/${review.slug}`}
      className={[
        'group block rounded-2xl border overflow-hidden transition-all duration-300',
        featured
          ? 'border-[#3d8b76]/40 bg-[#2a5c4f]/10 hover:border-[#3d8b76]/60 hover:bg-[#2a5c4f]/15'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
      ].join(' ')}>
      <div className="relative h-44 bg-gradient-to-br from-[#2a5c4f]/30 via-black to-[#94aea7]/20 overflow-hidden">
        {review.cover_image_url ? (
          <img src={review.cover_image_url} alt={review.fragrance_name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a5 5 0 015 5v1h1a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v1h6V7a3 3 0 00-3-3z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-[10px] uppercase tracking-wider text-white/70 border border-white/10">
            {CATEGORY_LABELS[review.category] || review.category}
          </span>
          {featured && (
            <span className="px-2 py-0.5 rounded-full bg-[#2a5c4f]/80 backdrop-blur text-[10px] text-[#94aea7] border border-[#3d8b76]/40 flex items-center gap-1">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`h-3.5 w-3.5 ${i < stars ? 'text-[#94aea7]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
          <span className="ml-1 text-xs text-gray-500">{review.rating_overall}</span>
        </div>

        <h2 className="font-semibold text-white text-base leading-snug line-clamp-1 group-hover:text-white transition">
          {review.fragrance_name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          {review.fragrance_houses?.slug
            ? <span className="hover:text-white transition" onClick={e => e.stopPropagation()}>
                <Link href={`/houses/${review.fragrance_houses.slug}`}>{review.house}</Link>
              </span>
            : review.house}
        </p>

        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{review.review_text}</p>

        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-600">
          <span>{review.profiles?.display_name || 'Anonymous'}</span>
          <span>{review.published_at ? new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
        </div>

        {review.fragrances?.slug && (
          <div className="mt-3 pt-3 border-t border-white/8">
            <span className="text-[11px] text-[#6b9e94] group-hover:text-[#94aea7] transition">
              View all reviews for this fragrance →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export async function getStaticProps() {
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('id, slug, fragrance_name, house, category, rating_overall, review_text, cover_image_url, published_at, featured, profiles(display_name), fragrances(slug), fragrance_houses!reviews_house_id_fkey(slug)')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(120);

  const reviews = allReviews || [];
  const featured = reviews.filter(r => r.featured);
  const rest = reviews.filter(r => !r.featured);

  return {
    props: { reviews: rest, featured },
    revalidate: 300,
  };
}
