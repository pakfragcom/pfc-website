'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden">
      {/* Background with subtle zoom */}
      <motion.div
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          src="/hero.jpg"
          alt="Fragrance background"
          fill
          priority
          className="object-cover object-center"
        />
      </motion.div>

      {/* Depth overlays */}
      {/* Dark readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
      {/* Subtle brand tint glow */}
      <div className="pointer-events-none absolute -inset-24 opacity-30"
           style={{
             background: 'radial-gradient(60% 40% at 50% 20%, rgba(42,92,79,0.35) 0%, transparent 60%)'
           }} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className="relative z-10 px-6 text-center max-w-3xl drop-shadow-hero"
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

        {/* Heading with brand gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white"
        >
          The Home of{' '}
          <span className="bg-gradient-to-r from-brand-300 to-brand-200 bg-clip-text text-transparent">
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
          {/* Primary */}
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-brand-500 to-brand-300 hover:from-brand-400 hover:to-brand-200"
          >
            Join the Community
          </a>

          {/* Secondary */}
          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white border border-white/40 hover:border-white/70 bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            Join the Forum
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
