import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import SplitBlock from '../components/SplitBlock';

export default function Home() {
  return (
    <>
      <Head>
        <title>PakFrag — Pakistan's Fragrance Community | Verified Sellers</title>
        <meta name="description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <link rel="canonical" href="https://pakfrag.com" />
        <meta property="og:title" content="PakFrag — Pakistan's Fragrance Community" />
        <meta property="og:description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <meta property="og:url" content="https://pakfrag.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://pakfrag.com/pfc-round.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pakfragcom" />
        <meta name="twitter:title" content="PakFrag — Pakistan's Fragrance Community" />
        <meta name="twitter:description" content="Pakistan's trusted fragrance community. Verify a seller before you buy, check the blacklist, and explore local fragrance houses." />
        <meta name="twitter:image" content="https://pakfrag.com/pfc-round.png" />
      </Head>
      <div className="bg-black text-white font-sans">
        <Header />
        <Hero />
        <Intro />
        <SplitBlock />
        <Footer />
      </div>
    </>
  );
}
