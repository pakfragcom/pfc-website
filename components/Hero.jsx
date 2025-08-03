'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center">
      {/* Background Image */}
      <Image
        src="/hero.jpg"
        alt="Hero Image"
        layout="fill"
        objectFit="cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="relative z-10 px-6 text-center max-w-2xl"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight uppercase text-white mb-6">
          The Home of Fragrance Enthusiasts
        </h1>

        <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-8 leading-relaxed">
          Pakistan Fragrance Community is where collectors, reviewers, and perfume lovers unite.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="https://www.facebook.com/groups/pkfragcom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 border border-gray-500 rounded-full text-sm uppercase tracking-wide text-white bg-white/10 hover:bg-white/20 transition font-medium"
          >
            Join the Community
          </a>

          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 border border-gray-500 rounded-full text-sm uppercase tracking-wide text-white bg-white/10 hover:bg-white/20 transition font-medium"
          >
            Join the Forum
          </a>
        </div>
      </motion.div>
    </section>
  )
}

