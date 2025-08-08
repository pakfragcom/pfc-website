'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background with subtle zoom */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          src="/hero.jpg"
          alt="Fragrance background"
          fill
          className="object-cover object-center"
          priority
        />
      </motion.div>

      {/* Depth: dark + brand tint */}
      <div className="absolute inset-0">
        {/* dark vignette for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        {/* subtle brand glow */}
        <div
          className="absolute -inset-24"
          style={{
            background:
              `radial-gradient(60% 40% at 50% 20%, color-mix(in oklab, var(--brand-500) 25%, transparent) 0%, transparent 60%)`
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className="relative z-10 px-6 text-center max-w-3xl"
      >
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-300 mb-4 block"
        >
          Pakistan Fragrance Community
        </motion.span>

        {/* Heading with brand accent */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg"
        >
          The Home of{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, var(--brand-300), var(--brand-200))`
            }}
          >
            Fragrance Enthusiasts
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="text-gray-300 text-sm sm:text-base md:text-lg mt-6 mb-10 leading-relaxed"
        >
          Where collectors, reviewers, and perfume lovers unite to share passion, discover rare scents,
          and celebrate the art of fragrance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{
              backgroundImage: `linear-gradient(90deg, var(--brand-500), var(--brand-300))`
            }}
          >
            Join the Community
          </a>

          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300"
            style={{
              border: `1px solid color-mix(in oklab, var(--brand-400), white 10%)`,
              background: `color-mix(in oklab, var(--brand-700) 15%, transparent)`
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `color-mix(in oklab, var(--brand-700) 25%, transparent)`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `color-mix(in oklab, var(--brand-700) 15%, transparent)`)}
          >
            Join the Forum
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
