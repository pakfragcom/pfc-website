import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Link from 'next/link'

export default function ServerError() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />

      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-4">500</p>

        <h1 className="text-4xl font-bold tracking-tight text-[#F5F5F7] sm:text-5xl">
          Something went wrong
        </h1>

        <p className="mt-4 max-w-sm text-base text-gray-400">
          We ran into an unexpected error on our end. Try refreshing — it usually fixes itself.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Go Home
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Try Again
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
