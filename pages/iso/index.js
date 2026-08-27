import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function IsoLanding() {
  return (
    <>
      <Head>
        <title>ISO — In Search Of | PFC</title>
        <meta name="description" content="Post what fragrance you're looking for, or explore what the community is currently searching for — no account needed." />
        <link rel="canonical" href="https://pakfrag.com/iso" />
      </Head>

      <div className="bg-[#0a0a0a] min-h-screen text-white">
        <Header />
        <main className="pt-28 pb-20 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#94aea7] mb-4">In Search Of</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Looking for a fragrance? Curious what everyone else is hunting for?
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-12">
              Post an ISO with just your WhatsApp — no account needed — or explore live demand across the community.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link href="/iso/post"
                className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#557d72]/50 p-8 text-left transition">
                <div className="w-11 h-11 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] mb-4">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#94aea7] transition mb-1.5">Post an ISO</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tell us the fragrance, condition, and how to reach you. We'll let you know if there's a match.
                </p>
              </Link>

              <Link href="/iso/explore"
                className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#557d72]/50 p-8 text-left transition">
                <div className="w-11 h-11 rounded-xl bg-[#2a5c4f]/30 flex items-center justify-center text-[#94aea7] mb-4">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white group-hover:text-[#94aea7] transition mb-1.5">Explore demand</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  See which fragrances the community is searching for most, right now.
                </p>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
