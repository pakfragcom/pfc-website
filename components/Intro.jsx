'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function Intro() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby="intro-heading"
      className="relative mx-auto max-w-5xl px-6 py-24 overflow-hidden text-center"
    >
      {/* Background accents (no layout shift) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2a5c4f]/12 blur-3xl" />
      <GridDither />

      {/* Eyebrow */}
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: reduce ? 0 : 0.5, ease: 'easeOut' }}
        className="mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300 backdrop-blur"
      >
        Pakistan Fragrance Community
      </motion.span>

      {/* Heading */}
      <motion.h2
        id="intro-heading"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: reduce ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 }}
        className="mx-auto mb-5 bg-gradient-to-b from-white to-white/70 bg-clip-text text-2xl font-extrabold uppercase tracking-wide text-transparent sm:text-3xl"
      >
        Welcome to the Premier Fragrance Community in Pakistan
      </motion.h2>

      {/* Body copy */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 0.5, ease: 'easeOut', delay: 0.1 }}
        className="mx-auto max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg"
      >
        Connecting perfume lovers, collectors, reviewers, and decanters under one trusted platform.
        Our mission is to elevate scent culture, build trust, and inspire the next generation of fragrance enthusiasts.
      </motion.p>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut', delay: 0.15 }}
        className="mx-auto mt-10 h-px w-24 origin-left bg-gradient-to-r from-transparent via-white/40 to-transparent"
        aria-hidden="true"
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut', delay: 0.2 }}
        className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
      >
        <Stat
          icon={<UsersIcon className="h-5 w-5 text-white/80" />}
          label="Members"
          valueEnd={100000}
          suffix="+"
          reduce={reduce}
          ariaLabel="One hundred thousand plus members"
        />
        <Stat
          icon={<ShieldIcon className="h-5 w-5 text-white/80" />}
          label="Verified Sellers"
          valueEnd={100}
          suffix="+"
          reduce={reduce}
          ariaLabel="One hundred plus verified sellers"
        />
        <StatInfinity
          icon={<StarIcon className="h-5 w-5 text-white/80" />}
          label="Reviews"
          ariaLabel="Infinite reviews"
        />
      </motion.div>
    </section>
  )
}

/* ---------- Components ---------- */

function Stat({ icon, label, valueEnd, suffix = '', reduce, ariaLabel }) {
  const [hasViewed, setHasViewed] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasViewed(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const value = useCountUp(hasViewed && !reduce ? valueEnd : valueEnd, {
    duration: reduce ? 0 : 900, // ms
  })

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2">
        {icon}
      </div>
      <div
        className="text-lg font-semibold leading-none text-white tabular-nums"
        aria-label={ariaLabel}
      >
        {formatNumber(value)}
        {suffix}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
    </div>
  )
}

function StatInfinity({ icon, label, ariaLabel }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2">
        {icon}
      </div>
      <div className="text-lg font-semibold leading-none text-white" aria-label={ariaLabel}>
        ∞
      </div>
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
    </div>
  )
}

/* ---------- Hooks & utils ---------- */

// Lightweight, GC‑friendly count‑up that respects reduced motion.
function useCountUp(target, { duration = 900 } = {}) {
  const [val, setVal] = useState(target)
  const rafRef = useRef()
  const startRef = useRef()
  const fromRef = useRef(0)
  const toRef = useRef(target)

  useEffect(() => {
    fromRef.current = val
    toRef.current = target
    startRef.current = undefined

    cancelAnimationFrame(rafRef.current)
    if (duration === 0 || fromRef.current === toRef.current) {
      setVal(target)
      return
    }

    const step = (t) => {
      if (startRef.current === undefined) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      const next = Math.round(
        fromRef.current + (toRef.current - fromRef.current) * eased
      )
      setVal(next)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return val
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat('en-US').format(n)
  } catch {
    return String(n)
  }
}

/* ---------- Decorative ---------- */

function GridDither() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -left-20 top-1/2 -z-10 hidden h-[520px] w-[520px] -translate-y-1/2 opacity-[0.07] md:block"
      viewBox="0 0 200 200"
      fill="none"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="white" />
        </pattern>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopOpacity="1" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#dots)" />
      <rect width="200" height="200" fill="url(#fade)" />
    </svg>
  )
}

/* ---------- Icons ---------- */

function UsersIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a4 4 0 10-3.999-4A4 4 0 0016 11zM8 12a3 3 0 10-3-3 3 3 0 003 3zm8 2a6.988 6.988 0 00-4.9 2h9.8A6.988 6.988 0 0016 14zM8 14a5.99 5.99 0 00-5.291 3.06A1 1 0 003.6 19h8.8a1 1 0 00.891-1.94A5.99 5.99 0 008 14z" />
    </svg>
  )
}

function ShieldIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l7 3v6c0 5.25-3.438 10.062-7 11-3.562-.938-7-5.75-7-11V5l7-3zm0 4.236l-5 2.143V11c0 4.07 2.625 8.027 5 8.945 2.375-.918 5-4.875 5-8.945V8.379l-5-2.143z" />
    </svg>
  )
}

function StarIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.62L12 2 10.19 8.62 3 9.24l4.46 4.73L5.82 21z" />
    </svg>
  )
}
