import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local Brand',
};

export default function UserProfile({ profile, reviews = [] }) {
  if (!profile) return null;

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  const initials = profile.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Head>
        <title>{profile.display_name} — Fragrance Reviews | PFC</title>
        <meta name="description" content={`${profile.display_name}'s fragrance reviews on PFC — Pakistan's fragrance community.${profile.city ? ` Based in ${profile.city}.` : ''}`} />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="pt-24 pb-20">
          {/* Profile header */}
          <div className="relative border-b border-white/10 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2a5c4f]/12 blur-3xl" />
            </div>
            <div className="max-w-4xl mx-auto px-6 py-12 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#2a5c4f] to-[#94aea7] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-4 ring-white/10">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
                    : initials
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-extrabold text-white">{profile.display_name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    {profile.city && (
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                        {profile.city}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">Member since {joinDate}</span>
                  </div>
                  {profile.bio && <p className="text-sm text-gray-400 mt-2 max-w-xl">{profile.bio}</p>}
                </div>

                {/* Stats */}
                <div className="flex gap-6 sm:flex-col sm:gap-2 sm:text-right">
                  <div>
                    <p className="text-2xl font-bold text-white">{reviews.length}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="max-w-4xl mx-auto px-6 mt-10">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-6">Reviews</h2>

            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No published reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <Link key={review.id} href={`/reviews/${review.slug}`}
                    className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-5 transition-all hover:border-white/20">
                    {/* Mini cover */}
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#2a5c4f]/40 to-[#94aea7]/20 flex-shrink-0 overflow-hidden">
                      {review.cover_image_url && (
                        <img src={review.cover_image_url} alt="" className="w-full h-full object-cover opacity-70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-white text-sm leading-snug">{review.fragrance_name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{review.house} · <span className="text-gray-600">{CATEGORY_LABELS[review.category]}</span></p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`h-3 w-3 ${i < Math.round(review.rating_overall) ? 'text-[#94aea7]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{review.review_text}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const { data } = await supabase.from('profiles').select('username').limit(100);
  return {
    paths: (data || []).map(p => ({ params: { username: p.username } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, city, bio, avatar_url, created_at')
    .eq('username', params.username)
    .single();

  if (!profile) return { notFound: true };

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, slug, fragrance_name, house, category, rating_overall, review_text, cover_image_url, published_at')
    .eq('author_id', profile.id)
    .eq('status', 'approved')
    .order('published_at', { ascending: false });

  return { props: { profile, reviews: reviews || [] }, revalidate: 300 };
}
