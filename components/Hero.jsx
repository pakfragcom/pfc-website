'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with subtle zoom */}
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

      {/* Dark gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 backdrop-blur-[2px]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="relative z-10 px-6 text-center max-w-3xl"
      >
        {/* Small label */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-300 mb-4 block"
        >
          Pakistan Fragrance Community
        </motion.span>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg"
        >
          The Home of&nbsp;
          <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Fragrance Enthusiasts
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1 }}
          className="text-gray-300 text-sm sm:text-base md:text-lg mt-6 mb-10 leading-relaxed"
        >
          Where collectors, reviewers, and perfume lovers unite to share passion, discover rare scents, and celebrate the art of fragrance.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 hover:from-teal-300 hover:via-cyan-300 hover:to-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Join the Community
          </a>

          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wide text-white border border-white/40 hover:border-white/70 hover:bg-white/10 transition-all duration-300"
          >
            Join the Forum
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}


