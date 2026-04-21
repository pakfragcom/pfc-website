import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import StatsBar from '../components/StatsBar';
import SplitBlock from '../components/SplitBlock';
import LatestReviews from '../components/LatestReviews';
import { supabase } from '../lib/supabase';

export default function Home({ latestReviews = [], stats = {}, topRated = [] }) {
  return (
    <div className="bg-black text-white font-sans">
      <Header />
      <Hero />
      <StatsBar stats={stats} />
      <Intro />
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
