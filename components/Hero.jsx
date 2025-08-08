'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Background with cinematic zoom */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />
      <div className="absolute inset-0 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)]" />

      {/* Accent glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#2a5c4f]/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#94aea7]/20 blur-3xl" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className="relative z-10 max-w-4xl px-6 text-center"
      >
        {/* Brand label */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-5 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.25em] text-gray-300 backdrop-blur"
        >
          Pakistan Fragrance Community
        </motion.span>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
        >
          The Home of{' '}
          <span className="bg-gradient-to-r from-[#2a5c4f] via-[#557d72] to-[#94aea7] bg-clip-text text-transparent">
            Fragrance Enthusiasts
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base md:text-lg"
        >
          Where collectors, reviewers, and perfume lovers unite to share passion, discover rare scents,
          and celebrate the timeless art of fragrance.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2a5c4f] via-[#557d72] to-[#94aea7] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition-all duration-300 hover:from-[#244e43] hover:via-[#75958d] hover:to-[#b6c6c2] hover:shadow-xl"
          >
            Join the Community
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M12.293 3.293a1 1 0 011.414 0l4.999 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
            </svg>
          </a>

          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:border-white/70 hover:bg-white/10"
          >
            Join the Forum
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
