import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const TIER_CONFIG = {
  0: { label: 'Unverified',        color: 'text-gray-400',    border: 'border-gray-500/30',   bg: 'bg-gray-500/10'   },
  1: { label: 'Community Verified', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  2: { label: 'Document Verified',  color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/10'   },
  3: { label: 'PakFrag Trusted',    color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/10'  },
};

const TYPE_LABEL = {
  BNIB:   'BNIB — includes Decanting',
  DECANT: 'Decanter / Vial Seller',
};

function TierBadge({ tier }) {
  const t = TIER_CONFIG[tier] || TIER_CONFIG[0];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${t.color} ${t.border} ${t.bg}`}>
      {tier >= 3 && <span>★</span>}
      {tier === 2 && <span>✓</span>}
      {tier === 1 && <ShieldIcon />}
      {t.label}
    </span>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V6l7-4z" />
    </svg>
  );
}

export default function SellerProfile({ seller, txStats }) {
  if (!seller) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Seller not found</p>
          <Link href="/tools/verify-seller" className="text-emerald-400 hover:underline text-sm">
            ← Back to Verify Seller
          </Link>
        </div>
      </div>
    );
  }

  const tier = seller.verification_tier ?? 0;
  const tierConf = TIER_CONFIG[tier] || TIER_CONFIG[0];
  const initials = seller.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = seller.added_at
    ? new Date(seller.added_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
    : null;

  const whatsapp = seller.contact_whatsapp || seller.whatsapp;
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${seller.name}, I found your profile on PakFrag.`)}`
    : null;

  const canonicalUrl = `https://pakfrag.com/sellers/${seller.slug}`;
  const description = seller.bio
    ? seller.bio.slice(0, 155)
    : `${seller.name} is a ${TIER_CONFIG[tier].label} fragrance seller on PakFrag — Pakistan's fragrance community. ${TYPE_LABEL[seller.seller_type] || ''}.`;

  return (
    <>
      <Head>
        <title>{seller.name} — Verified Seller | PakFrag</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${seller.name} — PakFrag Verified Seller`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content="https://pakfrag.com/pfc-round.png" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: seller.name,
          description,
          url: canonicalUrl,
          ...(seller.city ? { address: { '@type': 'PostalAddress', addressLocality: seller.city, addressCountry: 'PK' } } : {}),
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-3xl px-4 py-20 sm:py-28">

          {/* Breadcrumb */}
          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/tools/verify-seller" className="hover:text-white transition">Verify Seller</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">{seller.name}</span>
          </nav>

          {/* Profile card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden mb-8">
            {/* Header band */}
            <div className={`h-2 w-full ${tier >= 3 ? 'bg-amber-500/40' : tier === 2 ? 'bg-blue-500/40' : tier === 1 ? 'bg-emerald-500/40' : 'bg-white/10'}`} />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black ${tierConf.bg} ${tierConf.color} ring-1 ${tierConf.border}`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{seller.name}</h1>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <TierBadge tier={tier} />
                    {seller.seller_type && (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                        {TYPE_LABEL[seller.seller_type] || seller.seller_type}
                      </span>
                    )}
                    {seller.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {seller.city && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {seller.city}
                      </span>
                    )}
                    {memberSince && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                        </svg>
                        Member since {memberSince}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.595.33a18.095 18.095 0 005.223-5.223c.542-.815.369-1.896-.33-2.595L9.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                      Code: <span className="font-mono text-white">{seller.code}</span>
                    </span>
                  </div>

                  {seller.bio && (
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed max-w-lg">{seller.bio}</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              {waLink && (
                <div className="mt-6 pt-6 border-t border-white/8">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 px-5 py-2.5 text-sm font-semibold text-[#25D366] transition-all duration-200"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.537 4.049 1.475 5.754L0 24l6.428-1.682A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.001-1.374l-.358-.214-3.818.998 1.024-3.718-.234-.381A9.78 9.78 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818 5.414 0 9.818 4.404 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/>
                    </svg>
                    Contact on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Trust stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Verification',   value: TIER_CONFIG[tier]?.label?.split(' ')[0] || 'None' },
              { label: 'Transactions',   value: txStats?.total_transactions ?? 0 },
              { label: 'Success Rate',   value: txStats?.total_transactions ? `${Math.round(txStats.success_rate)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-center">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Experience ratings */}
          {txStats && txStats.total_transactions > 0 && (txStats.avg_rating_delivery || txStats.avg_rating_accuracy || txStats.avg_rating_communication) && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Buyer Experience Ratings</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Delivery',       value: txStats.avg_rating_delivery },
                  { label: 'Item Accuracy',  value: txStats.avg_rating_accuracy },
                  { label: 'Communication',  value: txStats.avg_rating_communication },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="text-center">
                    <div className="flex justify-center gap-0.5 mb-1">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} className={`w-3 h-3 ${n <= Math.round(value) ? 'text-[#94aea7]' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-white">{Number(value).toFixed(1)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">{label}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Transaction log section */}
          <div className="space-y-4 mb-6">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Transaction Record</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href="/disputes/new"
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-500/80 hover:text-amber-400 hover:border-amber-500/40 transition"
                    title="Report a dispute with this seller"
                  >
                    ⚑ Dispute
                  </Link>
                  <Link
                    href={`/log-transaction?seller=${seller.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition"
                  >
                    + Log a deal
                  </Link>
                </div>
              </div>
              {txStats && txStats.total_transactions > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{txStats.successful_transactions}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">Successful</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {txStats.avg_price_pkr ? `Rs ${Math.round(txStats.avg_price_pkr).toLocaleString()}` : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">Avg Price</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                    <p className="text-xl font-bold text-white">{txStats.total_items_sold ?? '—'}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">Items Sold</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No transactions logged yet. If you&apos;ve dealt with this seller,{' '}
                  <Link href={`/log-transaction?seller=${seller.slug}`} className="text-gray-300 hover:text-white underline underline-offset-2 transition">
                    be the first to log one
                  </Link>.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Active Listings</h2>
                <Link
                  href={`/marketplace?seller=${seller.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition"
                >
                  Browse marketplace →
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                View all active listings from this seller on the{' '}
                <Link href="/marketplace" className="text-gray-300 hover:text-white underline underline-offset-2 transition">
                  PakFrag marketplace
                </Link>.
              </p>
            </div>
          </div>

          {/* Verify link */}
          <div className="mt-10 text-center">
            <Link
              href={`/tools/verify-seller`}
              className="text-sm text-gray-500 hover:text-white transition"
            >
              ← Verify another seller
            </Link>
          </div>

        </main>

        <Footer />
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const { data } = await supabase
    .from('sellers')
    .select('slug')
    .in('status', ['active', 'grace'])
    .not('slug', 'is', null);

  return {
    paths: (data || []).map(s => ({ params: { slug: s.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, name, slug, code, seller_type, status, verification_tier, city, bio, contact_whatsapp, whatsapp, instagram, added_at')
    .eq('slug', params.slug)
    .in('status', ['active', 'grace'])
    .maybeSingle();

  if (!seller) return { notFound: true };

  const { data: txStats } = await supabase
    .from('seller_transaction_stats')
    .select('total_transactions, successful_transactions, success_rate, avg_price_pkr, total_items_sold, avg_rating_delivery, avg_rating_accuracy, avg_rating_communication, avg_rating_overall, last_transaction_at')
    .eq('seller_id', seller.id)
    .maybeSingle();

  return {
    props: { seller, txStats: txStats || null },
    revalidate: 300,
  };
}
