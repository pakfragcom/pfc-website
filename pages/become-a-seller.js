import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../lib/auth-context';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const TIERS = [
  {
    level: 'L0',
    name: 'Unverified',
    color: 'text-gray-400',
    ring: 'ring-white/10',
    bg: 'bg-white/[0.02]',
    badge: 'bg-white/10 text-gray-400',
    perks: [
      'No verification code',
      'Not listed on PakFrag',
      'Buyers cannot verify you',
    ],
    cta: null,
  },
  {
    level: 'L1',
    name: 'Community Verified',
    color: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    bg: 'bg-emerald-500/[0.04]',
    badge: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
    perks: [
      'Unique verification code buyers can check',
      'Public seller profile page',
      'Listed on the marketplace',
      'Transaction history visible to buyers',
      'Community trust score displayed',
    ],
    cta: 'Apply for L1',
    price: 'Rs 500 / month',
  },
  {
    level: 'L2',
    name: 'Document Verified',
    color: 'text-sky-400',
    ring: 'ring-sky-500/20',
    bg: 'bg-sky-500/[0.04]',
    badge: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
    perks: [
      'Everything in L1',
      'CNIC-verified badge on profile',
      'Highlighted in search results',
      'Access to featured listings',
      'Dispute resolution priority',
    ],
    cta: 'Apply for L2 after approval',
    price: 'Rs 500 / month',
  },
  {
    level: 'L3',
    name: 'PakFrag Trusted',
    color: 'text-amber-400',
    ring: 'ring-amber-500/20',
    bg: 'bg-amber-500/[0.04]',
    badge: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
    perks: [
      'Everything in L2',
      'Gold "PakFrag Trusted" badge',
      'Manually awarded by admin',
      'Top placement across all surfaces',
      'Exclusive seller analytics access',
    ],
    cta: 'Awarded by admin',
    price: 'Rs 500 / month',
  },
];

const FAQS = [
  {
    q: 'How long does verification take?',
    a: 'L1 applications are reviewed within 24 hours. Once approved, your verification code is active immediately.',
  },
  {
    q: 'What is the verification code?',
    a: 'A unique code buyers can look up at pakfrag.com/tools/verify-seller to confirm you are a real, registered seller. It\'s how trust travels across WhatsApp deals.',
  },
  {
    q: 'What do I need for L2?',
    a: 'A photo of your CNIC (front and back). Business registration proof is optional but speeds things up.',
  },
  {
    q: 'How do I pay?',
    a: 'After approval, admin will contact you with payment instructions (Easypaisa / JazzCash / bank transfer). Your profile goes live once payment is confirmed.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Your profile remains active until the subscription expires, then moves to grace period for 7 days.',
  },
];

export default function BecomeASeller() {
  const user = useUser();
  const router = useRouter();

  function handleApply() {
    if (!user) {
      router.push('/auth/login?next=/sellers/apply');
    } else {
      router.push('/sellers/apply');
    }
  }

  return (
    <>
      <Head>
        <title>Become a Verified Seller | PakFrag</title>
        <meta name="description" content="Join Pakistan's fragrance marketplace as a verified seller. Get a verification code, build your trust score, and reach serious buyers." />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="pt-24 pb-20">
          {/* Hero */}
          <div className="mx-auto max-w-4xl px-6 text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a5c4f]/20 border border-[#2a5c4f]/30 text-[#94aea7] text-xs font-medium mb-6">
              Seller Programme
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              Sell with trust.<br />
              <span className="text-[#94aea7]">Build a reputation that travels.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Every deal in Pakistan's fragrance market happens on WhatsApp. PakFrag becomes the trust layer above it — your verification code is the thing buyers check before sending money.
            </p>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-semibold px-8 py-3.5 rounded-2xl transition text-sm"
            >
              Start Application
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-xs text-gray-600 mt-3">Takes 2 minutes · No credit card needed to apply</p>
          </div>

          {/* Stats bar */}
          <div className="border-y border-white/6 bg-white/[0.02] py-6 mb-20">
            <div className="mx-auto max-w-4xl px-6 grid grid-cols-3 gap-4 text-center">
              {[
                ['Verified Sellers', '100+'],
                ['Deals Logged', '500+'],
                ['Buyers Verifying Monthly', '1,000+'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier cards */}
          <div className="mx-auto max-w-5xl px-6 mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Verification Tiers</h2>
            <p className="text-gray-500 text-sm text-center mb-10">More verification = more buyer confidence = more sales</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TIERS.map(tier => (
                <div key={tier.level}
                  className={`rounded-2xl border p-5 flex flex-col ${tier.ring} ${tier.bg}`}>
                  <div className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 mb-4 ${tier.badge}`}>
                    {tier.level} · {tier.name}
                  </div>
                  {tier.price && (
                    <p className={`text-sm font-semibold mb-3 ${tier.color}`}>{tier.price}</p>
                  )}
                  <ul className="space-y-2 flex-1">
                    {tier.perks.map(p => (
                      <li key={p} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className={`mt-0.5 text-[10px] ${tier.level === 'L0' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {tier.level === 'L0' ? '✕' : '✓'}
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="mx-auto max-w-3xl px-6 mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-10">How it works</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8 hidden sm:block" />
              <div className="space-y-8">
                {[
                  { n: '1', title: 'Apply', body: 'Fill in your name, city, WhatsApp, and seller type. Takes 2 minutes.' },
                  { n: '2', title: 'Admin review', body: 'We verify you are a real person with a fragrance background. Usually within 24 hours.' },
                  { n: '3', title: 'Get your code', body: 'You receive a unique verification code. Share it anywhere — your WhatsApp bio, your posts, your stories.' },
                  { n: '4', title: 'Buyers verify you', body: 'Buyers paste your code at pakfrag.com/tools/verify-seller before sending payment. Scams drop, trust rises.' },
                  { n: '5', title: 'Upgrade to L2', body: 'Submit your CNIC from the seller dashboard for document verification. No extra cost — same subscription.' },
                ].map(step => (
                  <div key={step.n} className="flex gap-5 sm:pl-10">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2a5c4f]/30 border border-[#2a5c4f]/50 flex items-center justify-center text-xs font-bold text-[#94aea7] relative z-10">
                      {step.n}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-white text-sm">{step.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="mx-auto max-w-2xl px-6 mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Common questions</h2>
            <div className="space-y-4">
              {FAQS.map(faq => (
                <div key={faq.q} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="font-medium text-white text-sm mb-1.5">{faq.q}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mx-auto max-w-xl px-6 text-center">
            <div className="rounded-3xl border border-[#2a5c4f]/30 bg-[#2a5c4f]/10 p-10">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to get verified?</h3>
              <p className="text-gray-400 text-sm mb-6">Join the sellers that serious buyers in Pakistan already trust.</p>
              <button
                onClick={handleApply}
                className="inline-flex items-center gap-2 bg-[#2a5c4f] hover:bg-[#3a7c6f] text-white font-semibold px-8 py-3 rounded-xl transition text-sm"
              >
                Start Application
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
