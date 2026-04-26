import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import StatsBar from '../components/StatsBar';
import SplitBlock from '../components/SplitBlock';
import LatestReviews from '../components/LatestReviews';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/auth-context';

const CATEGORY_BG = {
  designer:       'bg-sky-500/10 text-sky-400',
  middle_eastern: 'bg-amber-500/10 text-amber-400',
  niche:          'bg-purple-500/10 text-purple-400',
  local:          'bg-emerald-500/10 text-emerald-400',
};

function RecommendationStrip() {
  const user = useUser();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch('/api/recommendations')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  // Don't render anything for logged-out users or while loading (no layout shift)
  if (!user || loading || !data?.recommendations?.length) return null;

  const { recommendations, families } = data;
  const label = families?.length
    ? `Picked for you · ${families.slice(0, 3).join(', ')}`
    : 'Picked for you';

  return (
    <section className="py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[#94aea7] uppercase tracking-widest mb-1">Your Scent DNA</p>
            <h2 className="text-xl font-bold text-white">{label}</h2>
          </div>
          <Link href="/onboarding/scent-quiz"
            className="text-xs text-gray-500 hover:text-white transition">
            Refine →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recommendations.slice(0, 8).map(frag => (
            <Link
              key={frag.id}
              href={`/fragrances/${frag.slug}`}
              className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] overflow-hidden transition"
            >
              <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden">
                {frag.image_url ? (
                  <img src={frag.image_url} alt={frag.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl font-black text-white/10">{frag.name[0]}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-white leading-tight line-clamp-1 group-hover:text-[#94aea7] transition">
                  {frag.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{frag.house}</p>
                {frag.avgRating > 0 && (
                  <p className="text-[10px] text-[#94aea7] mt-1">★ {frag.avgRating} · {frag.reviewCount} reviews</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home({ latestReviews = [], stats = {}, topRated = [] }) {
  return (
    <div className="bg-black text-white font-sans">
      <Header />
      <Hero />
      <StatsBar stats={stats} />
      <Intro />
      <RecommendationStrip />
      <SplitBlock topRated={topRated} />
      <LatestReviews reviews={latestReviews} />
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: latestReviewsData },
    reviewsCount,
    fragrancesCount,
    reviewersCount,
    { data: topRatedRaw },
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, slug, fragrance_name, house, category, rating_overall, review_text, published_at, profiles(display_name)')
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(6),

    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('fragrances').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),

    supabase
      .from('reviews')
      .select('fragrance_id, fragrance_name, house, rating_overall, fragrances!reviews_fragrance_id_fkey(slug, image_url, category)')
      .eq('status', 'approved')
      .gte('published_at', thirtyDaysAgo)
      .not('fragrance_id', 'is', null),
  ]);

  // Group by fragrance_id, compute avg rating, take top 3
  const grouped = {};
  for (const r of topRatedRaw || []) {
    if (!r.fragrance_id) continue;
    if (!grouped[r.fragrance_id]) {
      grouped[r.fragrance_id] = {
        name:      r.fragrance_name,
        house:     r.house,
        slug:      r.fragrances?.slug      || null,
        image_url: r.fragrances?.image_url || null,
        category:  r.fragrances?.category  || null,
        ratings:   [],
      };
    }
    grouped[r.fragrance_id].ratings.push(Number(r.rating_overall));
  }
  const topRated = Object.values(grouped)
    .map(f => ({
      name:         f.name,
      house:        f.house,
      slug:         f.slug,
      image_url:    f.image_url,
      category:     f.category,
      avg_rating:   Math.round((f.ratings.reduce((a, b) => a + b, 0) / f.ratings.length) * 10) / 10,
      review_count: f.ratings.length,
    }))
    .sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)
    .slice(0, 3);

  return {
    props: {
      latestReviews: latestReviewsData || [],
      stats: {
        reviews:    reviewsCount.count    || 0,
        fragrances: fragrancesCount.count || 0,
        reviewers:  reviewersCount.count  || 0,
      },
      topRated,
    },
    revalidate: 300,
  };
}
