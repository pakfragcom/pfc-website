import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-500 mb-4">404</p>

        <h1 className="text-4xl font-bold tracking-tight text-[#F5F5F7] sm:text-5xl">
          Page not found
        </h1>

        <p className="mt-4 max-w-sm text-base text-gray-400">
          This page doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Go Home
          </Link>

          <Link
            href="/tools/verify-seller"
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Verify a Seller
          </Link>

          <Link
            href="/local-houses"
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Fragrance Houses
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
