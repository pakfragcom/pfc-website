import Head from 'next/head';
import Link from 'next/link';
import { m } from 'framer-motion';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  { id: 'all',            label: 'All Reviews' },
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

export default function Reviews({ reviews = [], activeCategory = 'all' }) {
  return (
    <>
      <Head>
        <title>Fragrance Reviews Pakistan | PFC</title>
        <meta name="description" content="Real fragrance reviews from Pakistan's fragrance community — Designer, Niche, Middle Eastern, and Local brands." />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="pt-24 pb-20">
          {/* Hero */}
          <div className="relative overflow-hidden border-b border-white/10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 h-64 w-[600px] rounded-full bg-[#2a5c4f]/12 blur-3xl" />
            </div>
            <div className="mx-auto max-w-5xl px-6 py-16 text-center relative">
              <span className="inline-block mb-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400 backdrop-blur">
                Community Reviews
              </span>
              <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
                Fragrance Reviews
                <span className="block text-2xl sm:text-3xl md:text-4xl bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent mt-1">
                  From Pakistan&apos;s Community
                </span>
              </h1>
              <p className="mt-4 text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                Honest, real-world wear tests by verified community members.
              </p>
              <div className="mt-6">
                <Link href="/reviews/submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 hover:brightness-110 transition">
                  Write a Review
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 mt-10">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-10">
              {CATEGORIES.map(cat => (
                <Link key={cat.id}
                  href={cat.id === 'all' ? '/reviews' : `/reviews?category=${cat.id}`}
                  className={[
                    'px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wide transition',
                    activeCategory === cat.id
                      ? 'bg-white text-black'
                      : 'bg-white/5 ring-1 ring-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  ].join(' ')}
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            {/* Reviews grid */}
            {reviews.length === 0 ? (
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <EmptyState />
              </m.div>
            ) : (
              <m.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
              >
                {reviews.map(review => (
                  <m.div
                    key={review.id}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
                    }}
                  >
                    <ReviewCard review={review} />
                  </m.div>
                ))}
              </m.div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

function ReviewCard({ review }) {
  const stars = Math.round(review.rating_overall);
  return (
    <Link href={`/reviews/${review.slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden card-lift glass-card">
      {/* Cover image placeholder / gradient */}
      <div className="relative h-44 bg-gradient-to-br from-[#2a5c4f]/30 via-black to-[#94aea7]/20 overflow-hidden">
        {review.cover_image_url ? (
          <img src={review.cover_image_url} alt={review.fragrance_name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-[10px] uppercase tracking-wider text-white/70 border border-white/10">
            {CATEGORY_LABELS[review.category] || review.category}
          </span>
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

        <h2 className="font-semibold text-white text-base leading-snug group-hover:text-white transition line-clamp-1">
          {review.fragrance_name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">{review.house}</p>

        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{review.review_text}</p>

        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-600">
          <span>{review.profiles?.display_name || 'Anonymous'}</span>
          <span>{review.published_at ? new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-5">
        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
      </div>
      <h3 className="text-white font-semibold mb-2">No reviews yet</h3>
      <p className="text-gray-500 text-sm mb-6">Be the first to share your experience.</p>
      <Link href="/reviews/submit"
        className="inline-flex items-center rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
        Write the First Review
      </Link>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  const category = query.category || 'all';
  let q = supabase
    .from('reviews')
    .select('id, slug, fragrance_name, house, category, rating_overall, review_text, cover_image_url, published_at, profiles(display_name)')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(48);

  if (category !== 'all') q = q.eq('category', category);

  const { data } = await q;
  return { props: { reviews: data || [], activeCategory: category } };
}
