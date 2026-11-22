import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProductFrame from '../../components/shop/ProductFrame';
import { useCart } from '../../lib/cart';
import { isShopEnabled, fetchProductBySlug } from '../../lib/shop';
import { formatPKR, variantLabel, BADGE_LABEL } from '../../lib/shop-format';

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  if (!(await isShopEnabled())) return { notFound: true, revalidate: 600 };
  const product = await fetchProductBySlug(params.slug);
  if (!product) return { notFound: true, revalidate: 600 };
  return { props: product, revalidate: 600 };
}


export default function ProductPage({ fragrance, offers = [] }) {
  const [selectedId, setSelectedId] = useState(offers[0]?.id);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const selected = offers.find((o) => o.id === selectedId) || offers[0];
  const onRequest = selected?.availability === 'on_request';
  const url = `https://pakfrag.com/shop/${fragrance.slug}`;

  function handleAdd() {
    if (!selected) return;
    add(selected.id, 1);
    setAdded(true);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fragrance.name,
    brand: { '@type': 'Brand', name: fragrance.house },
    image: selected?.image || undefined,
    description: fragrance.description || undefined,
    offers: offers.map((o) => ({
      '@type': 'Offer',
      url,
      priceCurrency: 'PKR',
      price: o.price_pkr,
      availability: o.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
    })),
  };

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>{`${fragrance.name} by ${fragrance.house} | PFC shop`}</title>
        <meta name="description" content={`Buy ${fragrance.name} by ${fragrance.house} from the Pakistan Fragrance Community. ${onRequest ? 'Available on request.' : 'In stock.'} Pay by bank transfer.`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-400">
          <Link href="/shop" className="underline underline-offset-2 decoration-white/30 transition hover:text-white hover:decoration-white">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{fragrance.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <ProductFrame src={selected?.image} name={fragrance.name} alt={`${fragrance.name} by ${fragrance.house}`} size="hero" priority />

          <div>
            <p className="text-sm text-gray-400">
              {fragrance.house_slug
                ? <Link href={`/houses/${fragrance.house_slug}`} className="underline underline-offset-2 decoration-white/30 hover:text-white">{fragrance.house}</Link>
                : fragrance.house}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl">{fragrance.name}</h1>

            {selected?.badge && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#94aea7]/30 bg-[#2a5c4f]/20 px-3 py-1 text-xs text-[#94aea7]">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {BADGE_LABEL[selected.badge] || selected.badge}
              </p>
            )}

            <fieldset className="mt-8">
              <legend className="mb-3 text-sm font-medium text-gray-300">Choose a size</legend>
              <div className="flex flex-col gap-2">
                {offers.map((o) => {
                  const active = o.id === selected?.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => { setSelectedId(o.id); setAdded(false); }}
                      aria-pressed={active}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${active ? 'border-white/60 bg-white/[0.07]' : 'border-white/10 bg-white/[0.03] hover:border-white/30'}`}
                    >
                      <span className="text-sm text-[#F5F5F7]">{variantLabel(o.variant)}</span>
                      <span className="flex items-center gap-3">
                        {o.availability === 'in_stock'
                          ? <span className="text-[11px] text-emerald-300">In stock</span>
                          : <span className="text-[11px] text-amber-300">On request</span>}
                        <span className="text-sm font-semibold text-[#F5F5F7]">{formatPKR(o.price_pkr)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-8">
              {added ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-emerald-300">{onRequest ? 'Added as a quote request.' : 'Added to your cart.'}</span>
                  <Link href="/cart" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e6ebe9]">View cart</Link>
                  <button type="button" onClick={() => setAdded(false)} className="text-sm text-gray-400 underline underline-offset-2 hover:text-white">Keep shopping</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
                >
                  {onRequest ? 'Request a quote' : 'Add to cart'}
                </button>
              )}
              <p className="mt-3 text-xs text-gray-500">
                {onRequest
                  ? 'We confirm availability and the final price with the seller first, then send you bank details.'
                  : 'Pay by bank transfer after you place the order. We ship once the payment is verified.'}
              </p>
            </div>

            {fragrance.description && (
              <div className="mt-10 border-t border-white/10 pt-6">
                <h2 className="text-base font-semibold text-[#F5F5F7]">About this fragrance</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{fragrance.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
