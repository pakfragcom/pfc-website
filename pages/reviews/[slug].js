import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../lib/auth-context';

const EASE = [0.25, 0.46, 0.45, 0.94];
const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local Brand',
};

function RatingBar({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7] transition-all"
          style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-4">{value}</span>
    </div>
  );
}

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-5 w-5 ${i < Math.round(value) ? 'text-[#94aea7]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="ml-1 text-white font-bold">{value} / 5</span>
    </div>
  );
}

function MiniStars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-3 w-3 ${i < Math.round(value) ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function ShareButton({ slug, title }) {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = `https://pakfrag.com/reviews/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button onClick={share}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-[#94aea7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

function EditReviewPanel({ review, onCancel, onSaved }) {
  const [text, setText] = useState(review.review_text);
  const [overall, setOverall] = useState(review.rating_overall || 5);
  const [longevity, setLongevity] = useState(review.rating_longevity || '');
  const [sillage, setSillage] = useState(review.rating_sillage || '');
  const [value, setValue] = useState(review.rating_value || '');
  const [occasion, setOccasion] = useState(review.occasion || '');
  const [season, setSeason] = useState(review.season || '');
  const [coverImg, setCoverImg] = useState(review.cover_image_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (text.trim().length < 80) { setError('Review must be at least 80 characters.'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/reviews/edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: review.id,
        review_text: text,
        rating_overall: Number(overall),
        rating_longevity: longevity ? Number(longevity) : null,
        rating_sillage: sillage ? Number(sillage) : null,
        rating_value: value ? Number(value) : null,
        occasion: occasion || null,
        season: season || null,
        cover_image_url: coverImg || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
    onSaved();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
      <h3 className="text-sm font-semibold text-white">Edit Review</h3>
      <textarea
        value={text} onChange={e => setText(e.target.value)} rows={6}
        className="w-full rounded-xl bg-black/40 ring-1 ring-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-white/25 resize-y placeholder-gray-600"
        placeholder="Your review..." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Overall', overall, setOverall], ['Longevity', longevity, setLongevity], ['Sillage', sillage, setSillage], ['Value', value, setValue]].map(([label, val, setter]) => (
          <div key={label}>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
            <input type="number" min="1" max="5" step="0.5" value={val}
              onChange={e => setter(e.target.value)}
              className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-white/25" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Occasion</label>
          <select value={occasion} onChange={e => setOccasion(e.target.value)}
            className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-white/25">
            <option value="">—</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="date">Date</option>
            <option value="work">Work</option>
            <option value="sport">Sport</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Season</label>
          <select value={season} onChange={e => setSeason(e.target.value)}
            className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-white/25">
            <option value="">—</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="autumn">Autumn</option>
            <option value="winter">Winter</option>
            <option value="all_season">All Season</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Cover Image URL</label>
        <input type="url" value={coverImg} onChange={e => setCoverImg(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-white/25 placeholder-gray-600" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-full bg-[#2a5c4f] hover:bg-[#3d8b76] text-sm font-medium text-white transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage({ review, fragrance = null, relatedReviews = [] }) {
  if (!review) return null;
  const author = review.profiles;
  const user = useUser();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Head>
        <title>{review.fragrance_name} by {review.house} — Review | PFC</title>
        <meta name="description" content={review.review_text.slice(0, 155)} />
        <link rel="canonical" href={`https://pakfrag.com/reviews/${review.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${review.fragrance_name} Review | PFC`} />
        <meta property="og:description" content={review.review_text.slice(0, 155)} />
        <meta property="og:url" content={`https://pakfrag.com/reviews/${review.slug}`} />
        {review.cover_image_url && <meta property="og:image" content={review.cover_image_url} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Review',
          itemReviewed: { '@type': 'Product', name: review.fragrance_name, brand: { '@type': 'Brand', name: review.house } },
          reviewRating: { '@type': 'Rating', ratingValue: String(review.rating_overall), bestRating: '5', worstRating: '1' },
          author: { '@type': 'Person', name: author?.display_name || 'PFC Member' },
          ...(review.published_at && { datePublished: review.published_at.slice(0, 10) }),
          reviewBody: review.review_text.slice(0, 500),
          publisher: { '@type': 'Organization', name: 'Pakistan Fragrance Community', url: 'https://pakfrag.com' },
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />
        <LazyMotion features={domAnimation}>
          <main className="pt-24 pb-20">
            {/* Cover */}
            <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-gradient-to-br from-[#2a5c4f]/40 via-black to-[#94aea7]/20">
              {review.cover_image_url && (
                <img src={review.cover_image_url} alt={review.fragrance_name}
                  className="absolute inset-0 w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="relative h-full flex flex-col justify-end max-w-3xl mx-auto px-6 pb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Link href="/fragrances" className="text-xs text-gray-400 hover:text-white transition">Fragrances</Link>
                  <span className="text-gray-700">/</span>
                  <span className="text-xs text-gray-400">{CATEGORY_LABELS[review.category]}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {review.fragrance_name}
                </h1>
                <p className="text-gray-400 mt-1 text-base">
                  {review.fragrance_houses?.slug
                    ? <Link href={`/houses/${review.fragrance_houses.slug}`} className="text-[#94aea7] hover:text-white transition">{review.house}</Link>
                    : review.house}
                </p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 mt-8">
              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2a5c4f] to-[#94aea7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {author?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    {author?.username
                      ? <Link href={`/u/${author.username}`} className="text-sm font-medium text-white hover:text-[#94aea7] transition">{author.display_name || 'Community Member'}</Link>
                      : <p className="text-sm font-medium text-white">{author?.display_name || 'Community Member'}</p>
                    }
                    {author?.city && <p className="text-xs text-gray-500">{author.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {review.occasion && <span className="capitalize">{review.occasion}</span>}
                  {review.season && <span className="capitalize">{review.season}</span>}
                  {review.published_at && (
                    <span>{new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                  <ShareButton slug={review.slug} title={`${review.fragrance_name} Review — PFC`} />
                </div>
              </div>

              {/* Fragrance directory strip */}
              {fragrance && (
                <m.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="mb-8"
                >
                  <Link href={`/fragrances/${fragrance.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] p-3 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden border border-white/10 bg-white/5">
                      {fragrance.image_url
                        ? <img src={fragrance.image_url} alt={fragrance.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/15 text-lg">◈</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{CATEGORY_LABELS[fragrance.category] || fragrance.category}</p>
                      <p className="text-sm font-semibold text-white leading-snug">
                        {fragrance.name}
                        {fragrance.concentration && <span className="ml-1.5 text-xs font-normal text-[#94aea7]">{fragrance.concentration}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{fragrance.house}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#94aea7] group-hover:text-white transition flex-shrink-0">
                      <span>View in directory</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </m.div>
              )}

              {/* Overall rating */}
              <div className="mb-8">
                <StarRating value={review.rating_overall} />
              </div>

              {/* Review text */}
              <div className="prose prose-invert prose-sm sm:prose-base max-w-none mb-10">
                {review.review_text.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i} className="text-gray-300 leading-relaxed mb-4">{para}</p>
                ))}
              </div>

              {/* Edit review (author only) */}
              {user?.id === review.author_id && (
                <div className="mb-10">
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit this review
                    </button>
                  ) : (
                    <EditReviewPanel review={review} onCancel={() => setEditing(false)} onSaved={() => router.reload()} />
                  )}
                </div>
              )}

              {/* Detailed ratings */}
              {(review.rating_longevity || review.rating_sillage || review.rating_value) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-10">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-5">Detailed Ratings</h3>
                  <div className="space-y-4">
                    <RatingBar label="Longevity" value={review.rating_longevity} />
                    <RatingBar label="Sillage" value={review.rating_sillage} />
                    <RatingBar label="Value" value={review.rating_value} />
                  </div>
                </div>
              )}

              {/* Back + submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
                <Link href="/reviews" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  All Reviews
                </Link>
                <Link href="/reviews/submit"
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-5 py-2 text-sm text-white hover:bg-white/10 transition">
                  Write Your Own Review
                </Link>
              </div>

              {/* Related reviews */}
              {relatedReviews.length > 0 && (
                <m.div
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="mt-14"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-white">
                      More reviews for <span className="text-[#94aea7]">{review.fragrance_name}</span>
                    </h2>
                    {fragrance && (
                      <Link href={`/fragrances/${fragrance.slug}`}
                        className="text-xs text-[#94aea7] hover:text-white transition flex items-center gap-1">
                        View all
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedReviews.map(r => (
                      <Link key={r.id} href={`/reviews/${r.slug}`}
                        className="group rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] p-4 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <MiniStars value={r.rating_overall} />
                          <span className="text-[10px] text-gray-600">
                            {r.published_at ? new Date(r.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 mb-2">{r.review_text}</p>
                        <p className="text-[10px] text-gray-600">{r.profiles?.display_name || 'Anonymous'}</p>
                      </Link>
                    ))}
                  </div>
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

export async function getStaticPaths() {
  const { data } = await supabase.from('reviews').select('slug').eq('status', 'approved').limit(100);
  return {
    paths: (data || []).map(r => ({ params: { slug: r.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: review } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, city, username), fragrance_houses!reviews_house_id_fkey(slug)')
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .single();

  if (!review) return { notFound: true };

  let fragrance = null;
  let relatedReviews = [];

  if (review.fragrance_id) {
    const { data: frag } = await supabase
      .from('fragrances')
      .select('id, name, slug, house, category, concentration, image_url')
      .eq('id', review.fragrance_id)
      .eq('status', 'approved')
      .maybeSingle();
    fragrance = frag || null;

    if (fragrance) {
      const { data: related } = await supabase
        .from('reviews')
        .select('id, slug, fragrance_name, rating_overall, review_text, published_at, profiles(display_name)')
        .eq('fragrance_id', fragrance.id)
        .eq('status', 'approved')
        .neq('slug', params.slug)
        .order('published_at', { ascending: false })
        .limit(4);
      relatedReviews = related || [];
    }
  }

  return {
    props: { review, fragrance, relatedReviews },
    revalidate: 300,
  };
}
