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

export default function FragranceDetail({ fragrance, reviews = [], related = [], priceStats = null, cityLongevity = [], likeCounts = {}, activeListings = [] }) {
  if (!fragrance) return null;

  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [likes, setLikes] = useState(likeCounts);
  const [myLikes, setMyLikes] = useState({});
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestFile, setSuggestFile] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestDone, setSuggestDone] = useState(false);

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

  useEffect(() => {
    if (!user || !reviews.length) return;
    const ids = reviews.map(r => r.id);
    fetch(`/api/reviews/my-likes?ids=${ids.join(',')}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setMyLikes(data));
  }, [user, reviews]);

  async function toggleLike(reviewId) {
    if (!user) { window.location.href = '/auth/login'; return; }
    const wasLiked = !!myLikes[reviewId];
    setMyLikes(m => ({ ...m, [reviewId]: !wasLiked }));
    setLikes(l => ({ ...l, [reviewId]: (l[reviewId] || 0) + (wasLiked ? -1 : 1) }));
    await fetch('/api/reviews/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId }),
    });
  }

  async function handleSuggestUpload() {
    if (!suggestFile) return;
    setSuggestLoading(true);
    const ext = suggestFile.name.split('.').pop();
    const urlRes = await fetch(`/api/fragrances/suggest-image?fragrance_id=${fragrance.id}&filename=image.${ext}`);
    if (!urlRes.ok) { setSuggestLoading(false); return; }
    const { signedUrl, path, publicUrl } = await urlRes.json();

    await fetch(signedUrl, { method: 'PUT', body: suggestFile, headers: { 'Content-Type': suggestFile.type } });

    await fetch('/api/fragrances/suggest-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragrance_id: fragrance.id, storage_path: path, image_url: publicUrl }),
    });
    setSuggestLoading(false);
    setSuggestDone(true);
    setSuggestFile(null);
  }

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
                  <div className="relative h-72 md:h-auto md:w-72 flex-shrink-0 overflow-hidden bg-black/60">
                    {fragrance.image_url ? (
                      <>
                        <img src={fragrance.image_url} alt="" aria-hidden
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-25 pointer-events-none" />
                        <img src={fragrance.image_url} alt={fragrance.name}
                          className="relative z-10 w-full h-full object-contain p-6 drop-shadow-2xl" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2a5c4f]/20 via-black to-[#94aea7]/10 flex flex-col items-center justify-center gap-3">
                        <span className="text-8xl font-black text-white/8 leading-none select-none">
                          {fragrance.name[0]?.toUpperCase()}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/15 font-medium px-6 text-center">
                          {fragrance.house}
                        </span>
                        {user && !suggestDone && (
                          <button onClick={() => setSuggestOpen(true)}
                            className="mt-2 text-[10px] text-[#94aea7]/60 hover:text-[#94aea7] border border-white/8 hover:border-white/20 rounded-lg px-3 py-1.5 transition">
                            + Suggest image
                          </button>
                        )}
                        {suggestDone && (
                          <span className="text-[10px] text-emerald-400/70">Image submitted for review</span>
                        )}
                      </div>
                    )}
                    {fragrance.image_url && user && !suggestDone && (
                      <button onClick={() => setSuggestOpen(true)}
                        className="absolute bottom-3 right-3 z-20 text-[10px] text-gray-600 hover:text-gray-300 bg-black/70 hover:bg-black/90 border border-white/8 rounded-lg px-2.5 py-1 transition">
                        Replace image
                      </button>
                    )}
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

              {/* Pakistan Price */}
              <PakistanPrice stats={priceStats} fragrance={fragrance} />

              {/* Active marketplace listings */}
              <ForSaleNow listings={activeListings} fragrance={fragrance} />

              {/* Climate-aware longevity */}
              <CityLongevity data={cityLongevity} fragrance={fragrance} />

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
                        <ReviewEntry
                          review={review}
                          likeCount={likes[review.id] || 0}
                          userLiked={!!myLikes[review.id]}
                          onLike={() => toggleLike(review.id)}
                        />
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

      {/* Suggest image modal */}
      {suggestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setSuggestOpen(false); setSuggestFile(null); } }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
            <h3 className="font-semibold text-white mb-1">Suggest an image</h3>
            <p className="text-xs text-gray-500 mb-4">
              For <span className="text-gray-300">{fragrance.name}</span>. Admins review before it goes live.
            </p>

            {suggestDone ? (
              <div className="text-center py-4">
                <p className="text-emerald-400 text-sm font-medium">Submitted for review</p>
                <p className="text-xs text-gray-500 mt-1">We'll approve or reject it shortly.</p>
                <button onClick={() => { setSuggestOpen(false); }}
                  className="mt-4 text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-4 py-2 rounded-lg transition">
                  Close
                </button>
              </div>
            ) : (
              <>
                <label className="block w-full cursor-pointer">
                  <div className={[
                    'border-2 border-dashed rounded-xl p-6 text-center transition',
                    suggestFile ? 'border-[#557d72] bg-[#557d72]/10' : 'border-white/10 hover:border-white/20'
                  ].join(' ')}>
                    {suggestFile ? (
                      <div>
                        <p className="text-sm text-white font-medium">{suggestFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(suggestFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-400">Click to select an image</p>
                        <p className="text-xs text-gray-600 mt-1">JPG, PNG or WebP · max 5 MB</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={e => setSuggestFile(e.target.files?.[0] || null)} />
                </label>

                <div className="flex gap-2 mt-4">
                  <button onClick={handleSuggestUpload}
                    disabled={!suggestFile || suggestLoading}
                    className="flex-1 text-sm bg-[#2a5c4f] hover:bg-[#3a7c6f] disabled:opacity-40 text-white font-medium rounded-xl py-2.5 transition">
                    {suggestLoading ? 'Uploading…' : 'Submit'}
                  </button>
                  <button onClick={() => { setSuggestOpen(false); setSuggestFile(null); }}
                    className="text-sm bg-white/5 hover:bg-white/10 text-gray-400 px-4 rounded-xl transition">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const CONDITION_LABEL = {
  sealed: 'Sealed', partial: 'Partial', decant: 'Decant', gift_set: 'Gift Set',
};

function ForSaleNow({ listings, fragrance }) {
  if (!listings || listings.length === 0) return null;

  const prices    = listings.map(l => l.price_pkr);
  const minPrice  = Math.min(...prices);
  const maxPrice  = Math.max(...prices);
  const samePrice = minPrice === maxPrice;

  const conditions = [...new Set(listings.map(l => l.condition))];

  return (
    <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-400/70 mb-0.5">For Sale Now</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-white">
              {samePrice
                ? `Rs ${minPrice.toLocaleString()}`
                : `Rs ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}`}
            </span>
            <span className="text-xs text-gray-500">
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {conditions.map(c => (
              <span key={c} className="text-[10px] text-gray-400 bg-white/5 border border-white/8 rounded px-1.5 py-0.5">
                {CONDITION_LABEL[c] || c}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={`/marketplace?q=${encodeURIComponent(fragrance.name)}`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 transition"
        >
          View Listings
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {listings.slice(0, 4).map(l => (
          <Link
            key={l.id}
            href={`/marketplace/${l.id}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-black/20 hover:bg-black/30 transition px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-300 truncate">
                {CONDITION_LABEL[l.condition] || l.condition}
                {l.fill_level_pct ? ` · ${l.fill_level_pct}%` : ''}
                {l.city ? ` · ${l.city}` : ''}
              </p>
              {l.sellers?.name && (
                <p className="text-[10px] text-gray-600 truncate">{l.sellers.name}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">Rs {l.price_pkr.toLocaleString()}</p>
              {l.is_negotiable && <p className="text-[10px] text-gray-500">nego</p>}
            </div>
          </Link>
        ))}
      </div>

      {listings.length > 4 && (
        <Link
          href={`/marketplace?q=${encodeURIComponent(fragrance.name)}`}
          className="mt-3 block text-center text-xs text-gray-500 hover:text-gray-300 transition"
        >
          +{listings.length - 4} more listing{listings.length - 4 !== 1 ? 's' : ''} →
        </Link>
      )}
    </div>
  );
}

function PakistanPrice({ stats, fragrance }) {
  if (!stats || !stats.transaction_count) {
    return (
      <div className="mb-10 rounded-2xl border border-white/8 bg-white/[0.02] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600 mb-0.5">Pakistan Price</p>
          <p className="text-sm text-gray-500">No community transactions logged yet.</p>
        </div>
        <Link
          href={`/log-transaction?fragrance=${encodeURIComponent(fragrance.name)}`}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition"
        >
          Log a deal →
        </Link>
      </div>
    );
  }

  const trend = stats.avg_price_30d && stats.avg_price_prev_30d
    ? stats.avg_price_30d - stats.avg_price_prev_30d
    : null;
  const trendPct = trend && stats.avg_price_prev_30d
    ? Math.round((trend / stats.avg_price_prev_30d) * 100)
    : null;

  return (
    <div className="mb-10 rounded-2xl border border-[#2a5c4f]/30 bg-[#2a5c4f]/5 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#94aea7] mb-0.5">Pakistan Price</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              Rs {Number(stats.avg_price_pkr).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">avg community price</span>
            {trendPct !== null && (
              <span className={`text-xs font-semibold ${trendPct > 0 ? 'text-red-400' : trendPct < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                {trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '→'} {Math.abs(trendPct)}% vs prev 30d
              </span>
            )}
          </div>
        </div>
        <Link
          href="/pakistan-fragrance-index"
          className="shrink-0 rounded-lg border border-[#2a5c4f]/40 bg-[#2a5c4f]/10 hover:bg-[#2a5c4f]/20 px-3 py-1.5 text-xs font-medium text-[#94aea7] transition"
        >
          Price Index →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Min',          value: `Rs ${Number(stats.min_price_pkr).toLocaleString()}` },
          { label: 'Max',          value: `Rs ${Number(stats.max_price_pkr).toLocaleString()}` },
          { label: 'Transactions', value: stats.transaction_count },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-black/20 p-3 text-center">
            <p className="text-sm font-bold text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Min-avg-max bar */}
      <div className="mt-4">
        <div className="relative h-1.5 rounded-full bg-white/10">
          {stats.min_price_pkr && stats.max_price_pkr && stats.avg_price_pkr && (() => {
            const range = stats.max_price_pkr - stats.min_price_pkr;
            const avgPct = range > 0
              ? ((stats.avg_price_pkr - stats.min_price_pkr) / range) * 100
              : 50;
            return (
              <>
                <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[#2a5c4f]/40 to-[#94aea7]/40" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#94aea7] shadow"
                  style={{ left: `clamp(0%, ${avgPct}%, 100%)` }}
                />
              </>
            );
          })()}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>Rs {Number(stats.min_price_pkr).toLocaleString()}</span>
          <span>Rs {Number(stats.max_price_pkr).toLocaleString()}</span>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-600">
        Based on {stats.success_count} verified deal{stats.success_count !== 1 ? 's' : ''} from the community.{' '}
        <Link href={`/log-transaction?fragrance=${encodeURIComponent(fragrance.name)}`} className="underline hover:text-gray-400 transition">
          Log yours
        </Link>
      </p>
    </div>
  );
}

// Longevity 1-5 → label
const LONGEVITY_LABEL = { 1: 'Very short', 2: 'Short', 3: 'Moderate', 4: 'Long', 5: 'Very long' };
function longevityBar(val) {
  const pct = ((val - 1) / 4) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#557d72]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 shrink-0">{val}/5</span>
    </div>
  );
}

function CityLongevity({ data, fragrance }) {
  if (!data || data.length === 0) {
    return (
      <div className="mb-10 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600 mb-0.5">Longevity by City</p>
          <p className="text-sm text-gray-500">Not enough city data yet — needs 3+ reviews per city.</p>
        </div>
        <Link href={`/reviews/submit?fragrance=${encodeURIComponent(fragrance.name)}&house=${encodeURIComponent(fragrance.house)}`}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition">
          Write a review →
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Longevity by City</p>
          <p className="text-xs text-gray-600">Community data · climate affects performance</p>
        </div>
        <Link href={`/reviews/submit?fragrance=${encodeURIComponent(fragrance.name)}&house=${encodeURIComponent(fragrance.house)}`}
          className="text-xs text-gray-600 hover:text-gray-300 transition">
          Add yours →
        </Link>
      </div>

      <div className="space-y-3">
        {data.map(row => (
          <div key={row.city} className="grid grid-cols-[120px_1fr_auto] gap-3 items-center">
            <div>
              <p className="text-xs font-medium text-white">{row.city}</p>
              {row.top_season && (
                <p className="text-[10px] text-gray-600 capitalize mt-0.5">{row.top_season}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 w-16 shrink-0">Longevity</span>
                {longevityBar(Number(row.avg_longevity))}
              </div>
              {row.avg_sillage && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 w-16 shrink-0">Sillage</span>
                  {longevityBar(Number(row.avg_sillage))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-600 text-right">{row.review_count} reviews</span>
          </div>
        ))}
      </div>
    </div>
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

function ReviewEntry({ review, likeCount = 0, userLiked = false, onLike }) {
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

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
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

        {/* Like button */}
        <button
          onClick={onLike}
          className={[
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition',
            userLiked
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-white/8 bg-transparent text-gray-600 hover:text-gray-300 hover:border-white/20',
          ].join(' ')}
        >
          <svg className="h-3.5 w-3.5" fill={userLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      </div>
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

  const [{ data: reviewRows }, { data: relatedRows }, { data: priceRow }, { data: cityLongevityRows }, { data: listingRows }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating_overall, rating_longevity, rating_sillage, rating_value, review_text, occasion, season, city, published_at, profiles(display_name, username)')
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
    supabase
      .from('fragrance_price_stats')
      .select('transaction_count, success_count, avg_price_pkr, min_price_pkr, max_price_pkr, avg_price_30d, avg_price_prev_30d, last_transaction_at')
      .ilike('fragrance_name', fragrance.name)
      .ilike('house', fragrance.house)
      .maybeSingle(),
    supabase
      .from('review_longevity_by_city')
      .select('city, review_count, avg_longevity, avg_sillage, top_season')
      .eq('fragrance_id', fragrance.id)
      .order('review_count', { ascending: false })
      .limit(6),
    supabase
      .from('listings')
      .select('id, condition, fill_level_pct, price_pkr, is_negotiable, city, sellers(name, verification_tier)')
      .eq('fragrance_id', fragrance.id)
      .eq('status', 'active')
      .order('price_pkr', { ascending: true })
      .limit(10),
  ]);

  // Like counts for all reviews on this fragrance
  const reviewIds = (reviewRows || []).map(r => r.id);
  let likeCounts = {};
  if (reviewIds.length) {
    const { data: likeRows } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);
    (likeRows || []).forEach(l => {
      likeCounts[l.review_id] = (likeCounts[l.review_id] || 0) + 1;
    });
  }

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
      likeCounts,
      related: (relatedRows || []).map(r => ({
        id: r.id, name: r.name, slug: r.slug, house: r.house, image_url: r.image_url || null,
      })),
      priceStats: priceRow || null,
      cityLongevity: cityLongevityRows || [],
      activeListings: (listingRows || []).map(l => ({
        id: l.id,
        condition: l.condition,
        fill_level_pct: l.fill_level_pct || null,
        price_pkr: l.price_pkr,
        is_negotiable: l.is_negotiable,
        city: l.city || null,
        sellers: l.sellers ? { name: l.sellers.name, verification_tier: l.sellers.verification_tier } : null,
      })),
    },
    revalidate: 60,
  };
}
