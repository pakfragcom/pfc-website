import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const CONDITION_LABEL = {
  sealed:   { label: 'Sealed / BNIB', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  partial:  { label: 'Partial Bottle', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  decant:   { label: 'Decant / Vial',  color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  gift_set: { label: 'Gift Set',       color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
};

const TIER_CONFIG = {
  0: { label: 'Unverified',        color: 'text-gray-400'    },
  1: { label: 'Community Verified', color: 'text-emerald-400' },
  2: { label: 'Document Verified',  color: 'text-blue-400'    },
  3: { label: 'PakFrag Trusted',    color: 'text-amber-400'   },
};

export default function ListingDetail({ listing }) {
  if (!listing) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Listing not found</p>
          <Link href="/marketplace" className="text-emerald-400 hover:underline text-sm">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const seller    = listing.sellers;
  const condConf  = CONDITION_LABEL[listing.condition] || { label: listing.condition, color: 'text-gray-400 border-white/10 bg-white/5' };
  const tierConf  = TIER_CONFIG[seller?.verification_tier ?? 0] || TIER_CONFIG[0];
  const daysLeft  = Math.max(0, Math.round(
    (new Date(listing.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const waText = encodeURIComponent(
    `Hi ${seller?.name}, I'm interested in your listing for ${listing.fragrance_name} (${condConf.label}, Rs ${listing.price_pkr?.toLocaleString()}) on PakFrag.`
  );
  const waPhone = seller?.contact_whatsapp || seller?.whatsapp;
  const waLink  = waPhone
    ? `https://wa.me/${waPhone.replace(/\D/g, '')}?text=${waText}`
    : null;

  const canonicalUrl  = `https://pakfrag.com/marketplace/${listing.id}`;
  const description   = `${listing.fragrance_name} by ${listing.house} — ${condConf.label} — Rs ${listing.price_pkr?.toLocaleString()}${listing.city ? ` in ${listing.city}` : ''}. Sold by verified PakFrag seller ${seller?.name}.`;

  return (
    <>
      <Head>
        <title>{listing.fragrance_name} — {condConf.label} | PakFrag Marketplace</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${listing.fragrance_name} (${condConf.label}) — Rs ${listing.price_pkr?.toLocaleString()}`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        {listing.images?.[0] && <meta property="og:image" content={listing.images[0]} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${listing.fragrance_name} by ${listing.house}`,
          description,
          url: canonicalUrl,
          ...(listing.images?.[0] ? { image: listing.images[0] } : {}),
          offers: {
            '@type': 'Offer',
            price: listing.price_pkr,
            priceCurrency: 'PKR',
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Person', name: seller?.name },
          },
        })}} />
      </Head>

      <div className="bg-black min-h-screen text-white font-sans">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-20 sm:py-28">

          {/* Breadcrumb */}
          <nav className="mb-10 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300 truncate">{listing.fragrance_name}</span>
          </nav>

          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            {/* Image */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden aspect-square flex items-center justify-center">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.fragrance_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
                  <span className="text-8xl font-black text-white/10 leading-none">
                    {listing.fragrance_name[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600 uppercase tracking-widest">{listing.house}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${condConf.color}`}>
                    {condConf.label}
                  </span>
                  {daysLeft <= 5 && daysLeft > 0 && (
                    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                      {daysLeft}d left
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F5F7] leading-tight">
                  {listing.fragrance_name}
                </h1>
                <p className="mt-1 text-base text-gray-400">{listing.house}</p>
                {listing.concentration && (
                  <p className="text-sm text-gray-500 mt-0.5">{listing.concentration}</p>
                )}
              </div>

              {/* Fill level */}
              {listing.fill_level_pct && listing.condition !== 'sealed' && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Fill level</span>
                    <span>{listing.fill_level_pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7]"
                      style={{ width: `${listing.fill_level_pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">Rs {listing.price_pkr?.toLocaleString()}</span>
                {listing.is_negotiable && (
                  <span className="text-sm text-gray-500 font-medium">Negotiable</span>
                )}
              </div>

              {listing.quantity > 1 && (
                <p className="text-sm text-gray-400">{listing.quantity} available</p>
              )}

              {listing.city && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {listing.city}
                </div>
              )}

              {/* WhatsApp CTA */}
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 px-6 py-3.5 text-sm font-semibold text-[#25D366] transition-all duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.537 4.049 1.475 5.754L0 24l6.428-1.682A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.001-1.374l-.358-.214-3.818.998 1.024-3.718-.234-.381A9.78 9.78 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818 5.414 0 9.818 4.404 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/>
                  </svg>
                  Contact Seller on WhatsApp
                </a>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-gray-500 text-center">
                  Contact via seller profile
                </div>
              )}

              <p className="text-xs text-gray-600 text-center">
                Complete transactions at your own risk. Always meet in public or use a trusted middleman.
              </p>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-6">
              <h2 className="text-sm font-semibold text-white mb-2">Description</h2>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Seller card */}
          {seller && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Seller</h2>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 text-lg font-black ring-1 ring-emerald-500/20">
                  {seller.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-white">{seller.name}</p>
                    <span className={`text-xs font-semibold ${tierConf.color}`}>{tierConf.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{seller.code}</p>
                </div>
                {seller.slug && (
                  <Link
                    href={`/sellers/${seller.slug}`}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-gray-300 transition"
                  >
                    View profile →
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <Link href="/marketplace" className="text-sm text-gray-500 hover:text-white transition">
              ← Back to Marketplace
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
    .from('listings')
    .select('id')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(500);

  return {
    paths: (data || []).map(l => ({ params: { id: l.id } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, fragrance_name, house, concentration, condition,
      fill_level_pct, price_pkr, is_negotiable, quantity,
      city, description, images, expires_at, created_at,
      sellers!inner(id, name, code, slug, verification_tier, contact_whatsapp, whatsapp)
    `)
    .eq('id', params.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!listing) return { notFound: true };

  return {
    props: { listing },
    revalidate: 120,
  };
}
