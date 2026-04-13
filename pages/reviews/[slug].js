import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';

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

export default function ReviewPage({ review }) {
  if (!review) return null;
  const author = review.profiles;

  return (
    <>
      <Head>
        <title>{review.fragrance_name} by {review.house} — Review | PFC</title>
        <meta name="description" content={review.review_text.slice(0, 155)} />
        <meta property="og:title" content={`${review.fragrance_name} Review | PFC`} />
        <meta property="og:description" content={review.review_text.slice(0, 155)} />
        {review.cover_image_url && <meta property="og:image" content={review.cover_image_url} />}
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

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
                <Link href="/reviews" className="text-xs text-gray-400 hover:text-white transition">Reviews</Link>
                <span className="text-gray-700">/</span>
                <span className="text-xs text-gray-400">{CATEGORY_LABELS[review.category]}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {review.fragrance_name}
              </h1>
              <p className="text-gray-400 mt-1 text-base">{review.house}</p>
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
                  <p className="text-sm font-medium text-white">{author?.display_name || 'Community Member'}</p>
                  {author?.city && <p className="text-xs text-gray-500">{author.city}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {review.occasion && <span className="capitalize">{review.occasion}</span>}
                {review.season && <span className="capitalize">{review.season}</span>}
                {review.published_at && (
                  <span>{new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
              </div>
            </div>

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
          </div>
        </main>
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
  const { data } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, city, username)')
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .single();

  if (!data) return { notFound: true };
  return { props: { review: data }, revalidate: 300 };
}
