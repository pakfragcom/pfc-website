import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import SplitBlock from '../components/SplitBlock';
import LatestReviews from '../components/LatestReviews';
import { supabase } from '../lib/supabase';

export default function Home({ latestReviews = [] }) {
  return (
    <div className="bg-black text-white font-sans">
      <Header />
      <Hero />
      <Intro />
      <SplitBlock />
      <LatestReviews reviews={latestReviews} />
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  const { data } = await supabase
    .from('reviews')
    .select('id, slug, fragrance_name, house, category, rating_overall, review_text, published_at, profiles(display_name)')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(6);

  return {
    props: { latestReviews: data || [] },
    revalidate: 300,
  };
}
