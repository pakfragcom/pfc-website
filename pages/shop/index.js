import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProductFrame from '../../components/shop/ProductFrame';
import { useCart } from '../../lib/cart';
import { isShopEnabled, fetchOffers, groupOffersByFragrance } from '../../lib/shop';
import { formatPKR, BADGE_LABEL } from '../../lib/shop-format';

export async function getStaticProps() {
  if (!(await isShopEnabled())) return { notFound: true, revalidate: 600 };
  const offers = await fetchOffers();
  const items = groupOffersByFragrance(offers);
  const houses = [...new Set(items.map((i) => i.house).filter(Boolean))].sort();
  return { props: { items, houses }, revalidate: 600 };
}

const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'bottle', label: 'Bottles' },
  { id: 'decant', label: 'Decants' },
];

export default function ShopPage({ items = [], houses = [] }) {
  const [house, setHouse] = useState('all');
  const [kind, setKind] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const { count } = useCart();

  const visible = useMemo(() => items.filter((i) =>
    (house === 'all' || i.house === house) &&
    (kind === 'all' || i.kinds.includes(kind)) &&
    (!inStockOnly || i.in_stock)
  ), [items, house, kind, inStockOnly]);

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>Shop fragrances | PFC</title>
        <meta name="description" content="Buy sealed fragrances and decants from the Pakistan Fragrance Community. Authenticity checked, pay by bank transfer." />
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">PFC shop</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#F5F5F7] sm:text-5xl">Fragrances</h1>
            <p className="mt-3 max-w-xl text-sm text-gray-400">
              Sealed bottles and decants, sourced through PFC-verified sellers. Pay by bank transfer once we confirm your order.
            </p>
          </div>
          <Link href="/cart" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200 transition hover:border-white/40 hover:text-white">
            Cart{count > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black">{count}</span>}
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${kind === k.id ? 'bg-white text-black' : 'border border-white/15 text-gray-300 hover:border-white/30 hover:text-white'}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          {houses.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <span className="sr-only">House</span>
              <select
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                className="rounded-full border border-white/15 bg-black px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-white/40"
              >
                <option value="all">All houses</option>
                {houses.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 accent-[#94aea7]" />
            In stock only
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-gray-400">
            Nothing matches those filters yet.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => (
              <li key={item.slug}>
                <Link href={`/shop/${item.slug}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl">
                  <ProductFrame src={item.image} name={item.name} alt={`${item.name} by ${item.house}`} />
                  <div className="mt-3 px-0.5">
                    <p className="text-xs text-gray-400">{item.house}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-[#F5F5F7] group-hover:text-white">{item.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[#F5F5F7]">{item.offer_count > 1 ? 'from ' : ''}{formatPKR(item.from_pkr)}</span>
                      {item.in_stock
                        ? <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">In stock</span>
                        : <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">On request</span>}
                    </div>
                    {item.badge && <p className="mt-1.5 text-[11px] text-[#94aea7]">{BADGE_LABEL[item.badge] || item.badge}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
