import Link from 'next/link';
import { m } from 'framer-motion';
import Reveal from './ui/Reveal';

const EASE = [0.25, 0.46, 0.45, 0.94];

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern',
  niche: 'Niche', local: 'Local Brand',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function LatestReviews({ reviews = [] }) {
  if (!reviews.length) return null;

  return (
    <section className="relative py-16 md:py-20 border-t border-white/10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-64 w-[500px] rounded-full bg-[#2a5c4f]/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 relative">
        <Reveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block mb-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400 backdrop-blur">
                Community Reviews
              </span>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Latest from the Community
              </h2>
            </div>
            <Link href="/reviews"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#94aea7] hover:text-white transition">
              All reviews
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {reviews.map(review => (
            <m.div key={review.id} variants={fadeUp}>
              <ReviewCard review={review} />
            </m.div>
          ))}
        </m.div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/reviews"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition">
            See all reviews
          </Link>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  const stars = Math.round(review.rating_overall);

  return (
    <Link href={`/reviews/${review.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 h-full">
      {/* Colour bar by category */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7] opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex flex-col flex-1">
        {/* Category + rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-600 border border-white/8 rounded-full px-2 py-0.5">
            {CATEGORY_LABELS[review.category] || review.category}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`h-3 w-3 ${i < stars ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
          </div>
        </div>

        {/* Fragrance name + house */}
        <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-white transition line-clamp-1">
          {review.fragrance_name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 mb-3">{review.house}</p>

        {/* Excerpt */}
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 flex-1">
          {review.review_text}
        </p>

        {/* Author + date */}
        <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-[11px] text-gray-600">
          <span>{review.profiles?.display_name || 'Anonymous'}</span>
          <span>
            {review.published_at
              ? new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
              : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
