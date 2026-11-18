import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CartLines from '../components/shop/CartLines';
import { useCart, useCartOffers } from '../lib/cart';
import { formatPKR } from '../lib/shop-format';

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const { items, loading, error, closed, needsQuote, subtotal } = useCartOffers(lines);

  return (
    <div className="bg-black text-white font-sans">
      <Head>
        <title>Your cart | PFC shop</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl">Your cart</h1>

        {error ? (
          <p className="mt-8 text-sm text-red-300">{error}</p>
        ) : loading ? (
          <p className="mt-8 text-sm text-gray-400">Loading your cart…</p>
        ) : closed ? (
          <p className="mt-8 text-sm text-gray-400">The shop is closed right now. Please check back soon.</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9]">Browse the shop</Link>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <CartLines items={items} onQty={setQty} onRemove={remove} />
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-400">{needsQuote ? 'Estimated subtotal' : 'Subtotal'}</span>
                <span className="text-lg font-semibold text-[#F5F5F7]">{formatPKR(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {needsQuote
                  ? 'Some items are on request. Placing the order sends us a quote request: we confirm the final price and delivery with the seller, then send you bank details. Nothing to pay yet.'
                  : 'Delivery is added at checkout. You pay by bank transfer after placing the order.'}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/shop" className="text-center text-sm text-gray-400 underline underline-offset-2 hover:text-white">Keep shopping</Link>
                <Link href="/checkout" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                  {needsQuote ? 'Continue to request quote' : 'Continue to checkout'}
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
