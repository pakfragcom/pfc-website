import Image from 'next/image'
import Link from 'next/link'
import Reveal from './ui/Reveal'

export default function SplitBlock() {
  return (
    <section
      style={{
        '--brand-1': '#2a5c4f',
        '--brand-2': '#557d72',
        '--brand-3': '#94aea7',
      }}
      className="relative isolate mx-auto max-w-7xl px-6 py-16 md:py-24 overflow-hidden"
      aria-labelledby="splitblock-title"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_65%)]" />
        <div
          className="absolute -top-28 left-0 h-80 w-80 rounded-full blur-3xl opacity-30 -translate-x-1/3 sm:translate-x-0"
          style={{ background: 'radial-gradient(closest-side, var(--brand-1), transparent)' }}
        />
        <div
          className="absolute -bottom-24 right-0 h-80 w-80 rounded-full blur-3xl opacity-25 translate-x-1/3 sm:translate-x-0"
          style={{ background: 'radial-gradient(closest-side, var(--brand-3), transparent)' }}
        />
        <div
          className="absolute -top-px left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--brand-2) 30%, transparent 50%, var(--brand-3) 70%, transparent)' }}
        />
      </div>

      <div className="flex flex-col items-stretch gap-8 md:flex-row md:gap-10">
        {/* Visual card */}
        <Reveal delay={0} className="w-full md:w-1/2">
          <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur">
            <Image
              src="/hero.jpg"
              alt="Fragrance visual"
              width={1200}
              height={900}
              className="h-full min-h-[280px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              priority
            />
            {/* Richer overlay gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2a5c4f]/20 via-transparent to-transparent" />
            {/* Badge */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-wider text-white/90 backdrop-blur-sm">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-slow"
                style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-3))' }}
              />
              Trusted Community
            </div>
          </div>
        </Reveal>

        {/* Content card */}
        <Reveal delay={0.13} className="w-full md:w-1/2">
          <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-black/20 to-black/40 p-8 shadow-xl shadow-black/30 backdrop-blur md:p-10">
            {/* Subtle inner glow top-left */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
              style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(42,92,79,0.25), transparent 60%)' }}
              aria-hidden="true"
            />

            <p className="relative mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
              Pakistan Fragrance Community
            </p>

            <h3 id="splitblock-title" className="relative mb-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
              <span>Discover.</span>{' '}
              <span>Review.</span>{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-2), var(--brand-3))' }}
              >
                Trade.
              </span>
            </h3>

            <p className="relative mb-8 text-base leading-relaxed text-white/70">
              Whether you&apos;re searching for a signature scent or sharing your experience,
              <span className="text-white/90"> PFC</span> is the trusted hub for perfume enthusiasts across Pakistan.
              Join our community, read real reviews, and get ready for our upcoming marketplace.
            </p>

            {/* Feature bullets — brand-colored checks */}
            <ul className="relative mb-8 space-y-3.5 text-sm text-white/80">
              <Bullet>Curated discussions &amp; real-world wear tests</Bullet>
              <Bullet>Seller verification &amp; safer trading guidelines</Bullet>
              <Bullet>Marketplace (coming soon) with dispute support</Bullet>
            </ul>

            {/* CTAs */}
            <div className="relative flex flex-col gap-3 sm:flex-row">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#2a5c4f]/25 transition-all hover:brightness-110 hover:shadow-[#2a5c4f]/40"
                style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3))' }}
              >
                Join the Community
              </a>
              <a
                href="/reviews"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10"
              >
                Read Reviews
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-3">
      <svg className="mt-0.5 h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="rgba(42,92,79,0.25)" stroke="rgba(42,92,79,0.6)" strokeWidth="1" />
        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#94aea7" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  )
}
