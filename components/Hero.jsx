'use client'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <section
      role="region"
      aria-labelledby="hero-heading"
      aria-describedby="hero-subheading"
      className={[
        'relative flex w-full items-center justify-center',
        // account for fixed header if needed: replace with min-h-[calc(100svh-64px)] if header is 64px high
        'min-h-[100svh]',
        'overflow-hidden bg-black' // fallback color—prevents white flash before image paints
      ].join(' ')}
    >
      {/* Background (decorative) with cinematic zoom */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{
          duration: reduce ? 0 : 7.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0 will-change-transform"
        style={{ transform: 'translateZ(0)' }}
        aria-hidden="true"
      >
        <Image
          src="/hero.jpg"
          alt=""                 // decorative; keep SR clean
          fill
          priority              // keep as LCP for homepage hero
          sizes="100vw"
          quality={85}
          draggable={false}
          className="select-none object-cover object-center"
        />
      </motion.div>

      {/* Depth overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/85" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_65%)] md:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block opacity-[0.07] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_75%)]"
        aria-hidden="true"
      />

      {/* Clip halos so blur can’t create horizontal overflow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#2a5c4f]/18 blur-2xl sm:translate-x-0" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 translate-x-1/2 rounded-full bg-[#94aea7]/18 blur-2xl sm:translate-x-0" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut', delay: 0.15 }}
        className="relative z-10 max-w-4xl px-6 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: 'easeOut', delay: 0.3 }}
          className="mb-5 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.25em] text-gray-300 backdrop-blur"
        >
          Pakistan Fragrance Community
        </motion.span>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.45 }}
          className="text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
        >
          The Home of{' '}
          <span className="bg-gradient-to-r from-[#2a5c4f] via-[#557d72] to-[#94aea7] bg-clip-text text-transparent">
            Fragrance Enthusiasts
          </span>
        </motion.h1>

        <motion.p
          id="hero-subheading"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.8, ease: 'easeOut', delay: 0.7 }}
          className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base md:text-lg"
        >
          Where collectors, reviewers, and perfume lovers unite to share passion, discover rare scents,
          and celebrate the timeless art of fragrance.
        </motion.p>

        <motion.div
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
            className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2a5c4f] via-[#557d72] to-[#94aea7] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition-all motion-safe:duration-300 hover:from-[#244e43] hover:via-[#75958d] hover:to-[#b6c6c2] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
            aria-label="Open PFC Forum (opens in new tab)"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all motion-safe:duration-300 hover:border-white/70 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Join the Forum
          </a>

          {/* Secondary 2 (new) */}
          <a
            href="https://www.facebook.com/groups/pakfragcom1.2"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Explore Pakistan’s Perfumery (opens in new tab)"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all motion-safe:duration-300 hover:border-white/70 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Explore Pakistan’s Perfumery
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center" aria-hidden="true">
        <a
          href="#main"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="Scroll to content"
        >
          <svg className="h-4 w-4 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 14a1 1 0 01-.7-.29l-5-5a1 1 0 111.4-1.42L10 11.59l4.3-4.3a1 1 0 111.4 1.42l-5 5A1 1 0 0110 14z" />
          </svg>
          <span>Scroll</span>
        </a>
      </div>
    </section>
  )
}
