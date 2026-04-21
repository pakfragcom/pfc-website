import Image from 'next/image'
import Link from 'next/link'
import Reveal from './ui/Reveal'

const CATEGORY_LABELS = {
  designer: 'Designer', middle_eastern: 'Middle Eastern', niche: 'Niche', local: 'Local Brand',
};

function MiniStars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-2.5 w-2.5 ${i < Math.round(value) ? 'text-[#94aea7]' : 'text-white/12'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function SplitBlock({ topRated = [] }) {
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2a5c4f]/20 via-transparent to-transparent" />
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
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
              style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(42,92,79,0.25), transparent 60%)' }}
              aria-hidden="true"
            />

            {topRated.length > 0 ? (
              /* Dynamic: top rated this month */
              <>
                <p className="relative mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
                  Pakistan Fragrance Community
                </p>
                <h3 id="splitblock-title" className="relative mb-5 text-2xl font-semibold leading-tight text-white md:text-3xl">
                  Top Rated{' '}
                  <span className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-2), var(--brand-3))' }}>
                    This Month
                  </span>
                </h3>

                <div className="relative space-y-3 mb-6">
                  {topRated.map((f, i) => (
                    <Link key={f.slug || i} href={f.slug ? `/fragrances/${f.slug}` : '/fragrances'}
                      className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06] p-3 transition-all duration-300">
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-white/10 bg-white/5">
                        {f.image_url
                          ? <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/15 text-base">◈</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-snug truncate group-hover:text-white transition">{f.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{f.house}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <MiniStars value={f.avg_rating} />
                        <p className="text-[9px] text-gray-600 mt-0.5">{f.review_count} review{f.review_count !== 1 ? 's' : ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row">
                  <Link href="/fragrances"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#2a5c4f]/25 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3))' }}>
                    Browse Directory
                  </Link>
                  <Link href="/reviews"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10">
                    Read Reviews
                  </Link>
                </div>
              </>
            ) : (
              /* Static fallback */
              <>
                <p className="relative mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
                  Pakistan Fragrance Community
                </p>
                <h3 id="splitblock-title" className="relative mb-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                  <span>Discover.</span>{' '}
                  <span>Review.</span>{' '}
                  <span className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-2), var(--brand-3))' }}>
                    Trade.
                  </span>
                </h3>
                <p className="relative mb-8 text-base leading-relaxed text-white/70">
                  Whether you&apos;re searching for a signature scent or sharing your experience,
                  <span className="text-white/90"> PFC</span> is the trusted hub for perfume enthusiasts across Pakistan.
                  Join our community, read real reviews, and get ready for our upcoming marketplace.
                </p>
                <ul className="relative mb-8 space-y-3.5 text-sm text-white/80">
                  <Bullet>Curated discussions &amp; real-world wear tests</Bullet>
                  <Bullet>Seller verification &amp; safer trading guidelines</Bullet>
                  <Bullet>Marketplace (coming soon) with dispute support</Bullet>
                </ul>
                <div className="relative flex flex-col gap-3 sm:flex-row">
                  <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#2a5c4f]/25 transition-all hover:brightness-110 hover:shadow-[#2a5c4f]/40"
                    style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3))' }}>
                    Join the Community
                  </a>
                  <a href="/reviews"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10">
                    Read Reviews
                  </a>
                </div>
              </>
            )}
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
