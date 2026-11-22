'use client'
import Image from 'next/image'
import { LazyMotion, domAnimation, m, useReducedMotion, useScroll, useTransform } from 'framer-motion'

export default function Hero() {
  const reduce = useReducedMotion()

  // Scroll-linked parallax: background drifts down and swells slightly while
  // the copy lifts and fades, so the hero feels like it recedes as you scroll.
  // Transform-only, so no layout shift; disabled under reduced motion.
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 140])
  const bgScale = useTransform(scrollY, [0, 800], [1, reduce ? 1 : 1.1])
  const contentOpacity = useTransform(scrollY, [0, 420], [1, reduce ? 1 : 0])
  const contentY = useTransform(scrollY, [0, 420], [0, reduce ? 0 : -36])

  return (
    <LazyMotion features={domAnimation}>
      <section
        role="region"
        aria-labelledby="hero-heading"
        aria-describedby="hero-subheading"
        className="relative flex w-full items-center justify-center min-h-[100svh] overflow-hidden bg-black"
      >
        {/* Background: scroll parallax (outer) + cinematic entry zoom (inner) */}
        <m.div
          className="absolute inset-0 will-change-transform"
          style={{ y: bgY, scale: bgScale }}
          aria-hidden="true"
        >
          <m.div
            initial={{ scale: 1.04 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduce ? 0 : 5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
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
        </m.div>

        {/* Depth overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/90" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_65%)] md:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.09),transparent_70%)]" aria-hidden="true" />

        {/* Brand halos */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#2a5c4f]/25 blur-3xl sm:translate-x-0" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-[#94aea7]/22 blur-3xl sm:translate-x-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#2a5c4f]/8 blur-3xl" />
        </div>

        {/* Content */}
        <m.div
          className="relative z-10 flex w-full justify-center"
          style={{ opacity: contentOpacity, y: contentY }}
        >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut', delay: 0.1 }}
          className="max-w-4xl px-6 text-center"
        >
          <m.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
          >
            The home of fragrance enthusiasts in Pakistan
          </m.h1>

          <m.p
            id="hero-subheading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.34 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg"
          >
            Over 100,000 collectors and perfume lovers. Check a seller before you pay,
            find local fragrance houses, and trade with people the community trusts.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.46 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
          >
            {/* Primary */}
            <a
              href="https://www.facebook.com/groups/pkfragcom"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
            >
              Join the community
              <span className="sr-only"> on Facebook (opens in new tab)</span>
            </a>

            {/* Secondary */}
            <a
              href="https://www.facebook.com/groups/pakfragcom1.2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
            >
              Explore Pakistan&apos;s perfumery
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </m.div>
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
