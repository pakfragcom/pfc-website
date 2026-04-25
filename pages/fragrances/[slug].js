import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';
import { useUser, useSupabaseClient } from '../../lib/auth-context';
import { track } from '../../lib/analytics';

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

export default function FragranceDetail({ fragrance, reviews = [], related = [] }) {
  if (!fragrance) return null;

  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!user || !supabaseClient) return;
    supabaseClient
      .from('fragrance_wishlist')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('fragrance_id', fragrance.id)
      .maybeSingle()
      .then(({ data }) => setWishlisted(!!data));
  }, [user, fragrance.id]);

  async function toggleWishlist() {
    if (!user) { window.location.href = '/auth/login'; return; }
    setWishlistLoading(true);
    const res = await fetch('/api/fragrances/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragrance_id: fragrance.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setWishlisted(data.wishlisted);
      track.wishlistToggled(fragrance.id, fragrance.name, data.wishlisted ? 'added' : 'removed');
    }
    setWishlistLoading(false);
  }

  const avgOverall   = avg(reviews, 'rating_overall');
  const avgLongevity = avg(reviews, 'rating_longevity');
  const avgSillage   = avg(reviews, 'rating_sillage');
  const avgValue     = avg(reviews, 'rating_value');

  return (
    <>
      <Head>
        <title>{fragrance.name} by {fragrance.house}{fragrance.concentration ? ` ${fragrance.concentration}` : ''} – Reviews in Pakistan | PakFrag</title>
        <meta name="description" content={
          reviews.length > 0
            ? `Read ${reviews.length} community review${reviews.length !== 1 ? 's' : ''} of ${fragrance.name} by ${fragrance.house}${fragrance.concentration ? ` ${fragrance.concentration}` : ''}. Longevity, sillage & value scores from Pakistan.${fragrance.year_released ? ` Released ${fragrance.year_released}.` : ''}`
            : `${fragrance.name} by ${fragrance.house}${fragrance.concentration ? ` ${fragrance.concentration}` : ''} in Pakistan's fragrance directory. Be the first to leave a review.${fragrance.year_released ? ` Released ${fragrance.year_released}.` : ''}`
        } />
        <link rel="canonical" href={`https://pakfrag.com/fragrances/${fragrance.slug}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${fragrance.name} by ${fragrance.house}${fragrance.concentration ? ` ${fragrance.concentration}` : ''} – Reviews | PakFrag`} />
        <meta property="og:description" content={`${fragrance.name} by ${fragrance.house}${fragrance.concentration ? ` ${fragrance.concentration}` : ''}${reviews.length > 0 ? ` — ${reviews.length} community review${reviews.length !== 1 ? 's' : ''} from Pakistan` : ' — Pakistan fragrance directory'}.`} />
        <meta property="og:url" content={`https://pakfrag.com/fragrances/${fragrance.slug}`} />
        <meta property="og:image" content={fragrance.image_url || 'https://pakfrag.com/pfc-round.png'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pakfragcom" />
        <meta name="twitter:title" content={`${fragrance.name} by ${fragrance.house} – Reviews | PakFrag`} />
        <meta name="twitter:description" content={`${fragrance.name} by ${fragrance.house}${reviews.length > 0 ? ` — ${reviews.length} community reviews from Pakistan` : ' — Pakistan fragrance directory'}.`} />
        <meta name="twitter:image" content={fragrance.image_url || 'https://pakfrag.com/pfc-round.png'} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pakfrag.com' },
            { '@type': 'ListItem', position: 2, name: 'Fragrance Directory', item: 'https://pakfrag.com/fragrances' },
            { '@type': 'ListItem', position: 3, name: fragrance.name, item: `https://pakfrag.com/fragrances/${fragrance.slug}` },
          ],
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: fragrance.name,
          brand: { '@type': 'Brand', name: fragrance.house },
          ...(fragrance.image_url ? { image: fragrance.image_url } : {}),
          ...(fragrance.description ? { description: fragrance.description } : {}),
          ...(fragrance.year_released ? { productionDate: String(fragrance.year_released) } : {}),
          url: `https://pakfrag.com/fragrances/${fragrance.slug}`,
          ...(reviews.length > 0 ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avgOverall.toFixed(1),
              reviewCount: reviews.length,
              bestRating: '5',
              worstRating: '1',
            },
          } : {}),
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">
            <div className="mx-auto max-w-5xl px-6">

              {/* Back */}
              <Link href="/fragrances"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-8">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Fragrance Directory
              </Link>

              {/* Header card */}
              <m.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden mb-10"
              >
                <div className="flex flex-col md:flex-row gap-0">
                  {/* Image */}
                  <div className="relative h-56 md:h-auto md:w-64 flex-shrink-0 bg-gradient-to-br from-[#2a5c4f]/20 via-black to-[#94aea7]/10">
                    {fragrance.image_url ? (
                      <img src={fragrance.image_url} alt={fragrance.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <span className="text-7xl font-black text-white/10 leading-none select-none">
                          {fragrance.name[0]?.toUpperCase()}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/10 font-medium px-6 text-center">
                          {fragrance.house}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
                  </div>

                  {/* Info */}
                  <div className="p-6 md:p-8 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-wider text-gray-400">
                        {CATEGORY_LABELS[fragrance.category] || fragrance.category}
                      </span>
                      {fragrance.concentration && (
                        <span className="px-2.5 py-1 rounded-full bg-[#2a5c4f]/20 border border-[#2a5c4f]/30 text-[11px] text-[#94aea7]">
                          {fragrance.concentration}
                        </span>
                      )}
                      {fragrance.year_released && (
                        <span className="text-xs text-gray-600">{fragrance.year_released}</span>
                      )}
                      <a href="#reviews"
                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:text-white hover:border-white/20 transition">
                        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                      </a>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      {fragrance.name}
                    </h1>
                    <p className="text-gray-400 mt-1 text-base">
                      by{' '}
                      {fragrance.house_slug ? (
                        <Link href={`/houses/${fragrance.house_slug}`}
                          className="text-[#94aea7] hover:text-white transition">
                          {fragrance.house}
                        </Link>
                      ) : fragrance.house}
                    </p>

                    {fragrance.description && (
                      <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-lg">
                        {fragrance.description}
                      </p>
                    )}

                    {/* Notes */}
                    {(fragrance.notes_top || fragrance.notes_heart || fragrance.notes_base) && (
                      <div className="mt-5 flex flex-wrap gap-4">
                        {[
                          { label: 'Top', value: fragrance.notes_top },
                          { label: 'Heart', value: fragrance.notes_heart },
                          { label: 'Base', value: fragrance.notes_base },
                        ].filter(n => n.value).map(n => (
                          <div key={n.label}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">{n.label}</p>
                            <p className="text-xs text-gray-300">{n.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ratings summary */}
                    {reviews.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-6">
                        <RatingStat label="Overall" value={avgOverall} count={reviews.length} large />
                        {avgLongevity > 0 && <RatingStat label="Longevity" value={avgLongevity} />}
                        {avgSillage > 0   && <RatingStat label="Sillage"   value={avgSillage} />}
                        {avgValue > 0     && <RatingStat label="Value"      value={avgValue} />}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/reviews/submit?fragrance=${encodeURIComponent(fragrance.name)}&house=${encodeURIComponent(fragrance.house)}&fid=${fragrance.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 hover:brightness-110 transition"
                      >
                        Write a Review
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </Link>
                      <button onClick={toggleWishlist} disabled={wishlistLoading}
                        className={[
                          'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50',
                          wishlisted
                            ? 'border-[#3d8b76]/50 bg-[#2a5c4f]/20 text-[#94aea7] hover:bg-[#2a5c4f]/30'
                            : 'border-white/15 bg-transparent text-gray-400 hover:text-white hover:border-white/30',
                        ].join(' ')}>
                        <svg className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {wishlisted ? 'Saved' : 'Want to Try'}
                      </button>
                    </div>
                  </div>
                </div>
              </m.div>

              {/* Related fragrances */}
              {related.length > 0 && (
                <RelatedFragrances related={related} category={fragrance.category} />
              )}

              {/* Reviews */}
              <div id="reviews">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Community Reviews
                  {reviews.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">({reviews.length})</span>
                  )}
                </h2>

                {reviews.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-white/8 bg-white/[0.02]">
                    <p className="text-gray-500 mb-4">No reviews yet — be the first.</p>
                    <Link
                      href={`/reviews/submit?fragrance=${encodeURIComponent(fragrance.name)}&house=${encodeURIComponent(fragrance.house)}&fid=${fragrance.id}`}
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
                    >
                      Write the First Review
                    </Link>
                  </div>
                ) : (
                  <m.div
                    initial="hidden" animate="show" variants={stagger}
                    className="space-y-4"
                  >
                    {reviews.map(review => (
                      <m.div key={review.id} variants={fadeUp}>
                        <ReviewEntry review={review} />
                      </m.div>
                    ))}
                  </m.div>
                )}
              </div>

            </div>
          </main>
        </LazyMotion>
        <Footer />
      </div>
    </>
  );
}

function RelatedFragrances({ related, category }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-4">
        More {CATEGORY_LABELS[category] || category} Fragrances
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {related.map(f => (
          <Link key={f.id} href={`/fragrances/${f.slug}`}
            className="group rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/20 hover:bg-white/[0.04] transition">
            <div className="relative h-24 bg-gradient-to-br from-[#2a5c4f]/20 via-black to-[#94aea7]/10">
              {f.image_url ? (
                <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-black text-white/10 leading-none select-none">{f.name[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-medium text-white leading-snug line-clamp-2 group-hover:text-[#94aea7] transition">{f.name}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 truncate">{f.house}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RatingStat({ label, value, count, large = false }) {
  const stars = Math.round(value);
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
        {label}{count ? ` · ${count} review${count !== 1 ? 's' : ''}` : ''}
      </p>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`${large ? 'h-4 w-4' : 'h-3 w-3'} ${i < stars ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
        </div>
        <span className={`${large ? 'text-sm font-semibold text-white' : 'text-xs text-gray-400'}`}>{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

function ReviewEntry({ review }) {
  const stars = Math.round(review.rating_overall);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`h-3.5 w-3.5 ${i < stars ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">{review.rating_overall}</span>
          </div>
          <p className="text-xs text-gray-500">
            {review.profiles?.username
              ? <Link href={`/u/${review.profiles.username}`} className="text-gray-400 hover:text-white transition">{review.profiles.display_name || 'Anonymous'}</Link>
              : review.profiles?.display_name || 'Anonymous'}
            {review.published_at && (
              <> · {new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </p>
        </div>

        {/* Sub-ratings */}
        {(review.rating_longevity || review.rating_sillage || review.rating_value) && (
          <div className="flex gap-3 text-[10px] text-gray-600 flex-shrink-0">
            {review.rating_longevity && <span>Longevity {review.rating_longevity}/5</span>}
            {review.rating_sillage   && <span>Sillage {review.rating_sillage}/5</span>}
            {review.rating_value     && <span>Value {review.rating_value}/5</span>}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{review.review_text}</p>

      {(review.occasion || review.season) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.occasion && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-gray-500 capitalize">
              {review.occasion}
            </span>
          )}
          {review.season && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-gray-500 capitalize">
              {review.season}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Helper
function avg(reviews, field) {
  const vals = reviews.map(r => Number(r[field])).filter(v => v > 0);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export async function getStaticPaths() {
  const { data } = await supabase
    .from('fragrances')
    .select('slug')
    .eq('status', 'approved');

  return {
    paths: (data || []).map(f => ({ params: { slug: f.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: fragrance } = await supabase
    .from('fragrances')
    .select(`
      id, name, slug, house, category, concentration, description,
      image_url, notes_top, notes_heart, notes_base, year_released,
      house_id, fragrance_houses(slug)
    `)
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .maybeSingle();

  if (!fragrance) return { notFound: true };

  const [{ data: reviewRows }, { data: relatedRows }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating_overall, rating_longevity, rating_sillage, rating_value, review_text, occasion, season, published_at, profiles(display_name, username)')
      .eq('fragrance_id', fragrance.id)
      .eq('status', 'approved')
      .order('published_at', { ascending: false }),
    supabase
      .from('fragrances')
      .select('id, name, slug, house, image_url')
      .eq('status', 'approved')
      .eq('category', fragrance.category)
      .neq('id', fragrance.id)
      .limit(4),
  ]);

  const serialized = {
    id:            fragrance.id,
    name:          fragrance.name,
    slug:          fragrance.slug,
    house:         fragrance.house,
    house_slug:    fragrance.fragrance_houses?.slug || null,
    category:      fragrance.category,
    concentration: fragrance.concentration || null,
    description:   fragrance.description   || null,
    image_url:     fragrance.image_url     || null,
    notes_top:     fragrance.notes_top     || null,
    notes_heart:   fragrance.notes_heart   || null,
    notes_base:    fragrance.notes_base    || null,
    year_released: fragrance.year_released || null,
  };

  return {
    props: {
      fragrance: serialized,
      reviews: reviewRows || [],
      related: (relatedRows || []).map(r => ({
        id: r.id, name: r.name, slug: r.slug, house: r.house, image_url: r.image_url || null,
      })),
    },
    revalidate: 300,
  };
}
