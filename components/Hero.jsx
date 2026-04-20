'use client'
import Image from 'next/image'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <section
        role="region"
        aria-labelledby="hero-heading"
        aria-describedby="hero-subheading"
        className="relative flex w-full items-center justify-center min-h-[100svh] overflow-hidden bg-black"
      >
        {/* Background with cinematic zoom */}
        <m.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduce ? 0 : 7.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 will-change-transform"
          style={{ transform: 'translateZ(0)' }}
          aria-hidden="true"
        >
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={90}
            draggable={false}
            className="select-none object-cover object-center"
          />
        </m.div>

        {/* Depth overlays — slightly deeper for more pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/90" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_65%)] md:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.09),transparent_70%)]" aria-hidden="true" />

        {/* Brand halos — richer and more visible */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#2a5c4f]/25 blur-3xl sm:translate-x-0" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-[#94aea7]/22 blur-3xl sm:translate-x-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#2a5c4f]/8 blur-3xl" />
        </div>

        {/* Content */}
        <m.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut', delay: 0.15 }}
          className="relative z-10 max-w-4xl px-6 text-center"
        >
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: 'easeOut', delay: 0.3 }}
            className="mb-5 inline-block rounded-full border border-white/15 bg-white/8 px-4 py-1 text-xs uppercase tracking-[0.25em] text-gray-200 backdrop-blur-sm"
          >
            Pakistan Fragrance Community
          </m.span>

          <m.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.45 }}
            className="text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
          >
            The Home of{' '}
            <span className="bg-gradient-to-r from-[#3d8b76] via-[#6b9e94] to-[#a8c4be] bg-clip-text text-transparent">
              Fragrance Enthusiasts
            </span>
          </m.h1>

          <m.p
            id="hero-subheading"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.8, ease: 'easeOut', delay: 0.7 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base md:text-lg"
          >
            Where collectors, reviewers, and perfume lovers unite to share passion, discover rare scents,
            and celebrate the timeless art of fragrance.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.8, ease: 'easeOut', delay: 0.95 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap"
          >
            {/* Primary */}
            <a
              href="https://www.facebook.com/groups/pkfragcom"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the Pakistan Fragrance Community Facebook group (opens in new tab)"
              className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2a5c4f] via-[#4a7a6e] to-[#94aea7] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#2a5c4f]/30 transition-all motion-safe:duration-300 hover:shadow-[#2a5c4f]/50 hover:shadow-xl hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Join the Community
              <svg className="ml-2 h-4 w-4 motion-safe:transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.293 3.293a1 1 0 011.414 0l4.999 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
              <span className="sr-only"> (opens in new tab)</span>
            </a>

            {/* Secondary 1 */}
            <a
              href="https://discord.gg/c7zAXTzxph"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord server (opens in new tab)"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-all motion-safe:duration-300 hover:border-white/60 hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Join our Discord
            </a>

            {/* Secondary 2 */}
            <a
              href="https://www.facebook.com/groups/pakfragcom1.2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Explore Pakistan's Perfumery (opens in new tab)"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-all motion-safe:duration-300 hover:border-white/60 hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Explore Pakistan&apos;s Perfumery
            </a>
          </m.div>
        </m.div>

        {/* Scroll cue — smooth float instead of mechanical bounce */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center" aria-hidden="true">
          <a
            href="#main"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-gray-400 backdrop-blur-sm transition hover:text-white hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Scroll to content"
          >
            <svg className="h-4 w-4 animate-float" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14a1 1 0 01-.7-.29l-5-5a1 1 0 111.4-1.42L10 11.59l4.3-4.3a1 1 0 111.4 1.42l-5 5A1 1 0 0110 14z" />
            </svg>
            <span>Scroll</span>
          </a>
        </div>
      </section>
    </LazyMotion>
  )
}
