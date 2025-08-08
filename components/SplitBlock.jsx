import Image from 'next/image'
import Link from 'next/link'

export default function SplitBlock() {
  return (
    <section
      // Set brand hues once; matches your Hero gradient
      style={{
        '--brand-1': '#2a5c4f',
        '--brand-2': '#557d72',
        '--brand-3': '#94aea7',
      }}
      className="relative isolate mx-auto max-w-7xl px-6 py-16 md:py-24 overflow-hidden"
      aria-labelledby="splitblock-title"
    >
      {/* Background: subtle texture + halos (same language as Hero) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* soft radial texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_65%)]" />
        {/* gradient halos */}
        <div
          className="absolute -top-28 left-0 h-72 w-72 rounded-full blur-3xl opacity-25 -translate-x-1/3 sm:translate-x-0"
          style={{ background: 'radial-gradient(closest-side, var(--brand-1), transparent)' }}
        />
        <div
          className="absolute -bottom-24 right-0 h-72 w-72 rounded-full blur-3xl opacity-20 translate-x-1/3 sm:translate-x-0"
          style={{ background: 'radial-gradient(closest-side, var(--brand-3), transparent)' }}
        />
        {/* hairline top separator to blend from hero */}
        <div
          className="absolute -top-px left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, var(--brand-1), transparent 40%, transparent 60%, var(--brand-3))' }}
        />
      </div>

      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
        {/* Visual card */}
        <div className="w-full md:w-1/2">
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <Image
              src="/hero.jpg"
              alt="Fragrance visual"
              width={1200}
              height={900}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wider text-white/80 backdrop-blur">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-3))' }}
              />
              Trusted Community
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full md:w-1/2">
          <div className="relative h-full rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl backdrop-blur md:p-10">
            {/* eyebrow / label */}
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
              Pakistan Fragrance Community
            </p>

            <h3 id="splitblock-title" className="mb-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
              <span>Discover.</span>{' '}
              <span>Review.</span>{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-1), var(--brand-3))' }}
              >
                Trade.
              </span>
            </h3>

            <p className="mb-8 text-base leading-relaxed text-white/75">
              Whether you’re searching for a signature scent or sharing your experience,
              <span className="text-white/90"> PFC</span> is the trusted hub for perfume enthusiasts across Pakistan.
              Join our community, read real reviews, and get ready for our upcoming marketplace.
            </p>

            {/* Feature bullets */}
            <ul className="mb-8 space-y-3 text-sm text-white/85">
              <Bullet>Curated discussions & real-world wear tests</Bullet>
              <Bullet>Seller verification & safer trading guidelines</Bullet>
              <Bullet>Marketplace (coming soon) with dispute support</Bullet>
            </ul>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-lg transition-all
                           bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2),var(--brand-3))]
                           hover:brightness-110"
              >
                Join the Community
              </a>
              <Link
                href="/reviews"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white
                           transition hover:border-white/60 hover:bg-white/10"
              >
                Read Reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* Small helpers (no extra deps) */
function Bullet({ children }) {
  return (
    <li className="flex items-start gap-3">
      <svg className="mt-0.5 h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 7L10 17l-6-6" stroke="currentColor" strokeWidth="2" className="text-white/75" />
        <circle cx="12" cy="12" r="11" className="text-white/15" stroke="currentColor" strokeWidth="0.5" fill="none" />
      </svg>
      <span>{children}</span>
    </li>
  )
}
