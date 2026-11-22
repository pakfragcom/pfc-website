import Image from 'next/image'
import Link from 'next/link'
import Reveal from './ui/Reveal'

function TrustedPill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-slow"
        style={{ background: 'linear-gradient(90deg, var(--brand-1), var(--brand-3))' }}
      />
      Trusted community
    </div>
  );
}

// Latest Instagram posts (fetched server-side, hourly). Plain links and
// lazy images: no Instagram script, so nothing for the CSP to block.
function InstagramGrid({ username, posts }) {
  const profile = username ? `https://www.instagram.com/${username}/` : 'https://www.instagram.com/';
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <TrustedPill />
        <a
          href={profile}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-white/70 transition hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          {username ? `@${username}` : 'Instagram'}
        </a>
      </div>
      <ul className="grid flex-1 grid-cols-3 gap-1.5 sm:gap-2">
        {posts.map((p) => (
          <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
            <a
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={p.caption ? `Instagram post: ${p.caption}` : 'Open this post on Instagram'}
            >
              <img
                src={p.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />
              {p.isVideo && (
                <svg viewBox="0 0 24 24" className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </a>
          </li>
        ))}
      </ul>
      <a
        href={profile}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white"
      >
        Follow us on Instagram
      </a>
    </div>
  );
}

export default function SplitBlock({ instagram = null }) {
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
          {instagram?.posts?.length ? (
            <InstagramGrid username={instagram.username} posts={instagram.posts} />
          ) : (
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
            <div className="absolute left-4 top-4">
              <TrustedPill />
            </div>
          </div>
          )}
        </Reveal>

        {/* Content card */}
        <Reveal delay={0.13} className="w-full md:w-1/2">
          <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-black/20 to-black/40 p-8 shadow-xl shadow-black/30 backdrop-blur md:p-10">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
              style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(42,92,79,0.25), transparent 60%)' }}
              aria-hidden="true"
            />

            <h3 id="splitblock-title" className="relative mb-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
              Buy, sell and talk fragrance with people you can trust
            </h3>
            <p className="relative mb-8 text-base leading-relaxed text-white/70">
              The PFC Facebook group is where members ask questions, share wear tests and find
              bottles. This site adds the tools that keep trading safe.
            </p>
            <ul className="relative mb-8 space-y-3.5 text-sm text-white/80">
              <Bullet>A registry of verified sellers and a public scam blacklist</Bullet>
              <Bullet>A directory of Pakistani fragrance houses</Bullet>
              <Bullet>An In Search Of board for hard-to-find bottles</Bullet>
            </ul>
            <div className="relative flex flex-col gap-3 sm:flex-row">
              <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                Join the community
                <span className="sr-only"> on Facebook (opens in new tab)</span>
              </a>
              <Link href="/iso"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                Browse the ISO board
              </Link>
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
