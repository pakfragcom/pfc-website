'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ShieldCheck, Building2, Droplets, Ruler, FlaskConical, ArrowRight } from 'lucide-react'

const EASE = [0.25, 0.46, 0.45, 0.94]

// Three scroll-revealed feature blocks: oversized headline + copy on one side,
// a visual card on the other, alternating. Text lifts in on view; the card
// drifts on scroll (transform only, no layout shift). All motion collapses to
// zero under prefers-reduced-motion.
export default function HomeFeatures({ houses = [], housesTotal = 0, sellers = [] }) {
  const housesLabel = housesTotal >= 10 ? `${Math.floor(housesTotal / 10) * 10}+` : '80+'
  return (
    <LazyMotion features={domAnimation}>
      <div className="relative overflow-hidden">
        <Feature
          eyebrow="Buy safely"
          title={<>Verify before <span className="text-[#94aea7]">you pay.</span></>}
          body="Every PFC seller has a code. Search a name or code, check the public blacklist, and know exactly who you're dealing with — in seconds."
          cta="Verify a seller"
          href="/tools/verify-seller"
          visual={<VerifyCard sellers={sellers} />}
          halo="#2a5c4f"
          interactive
        />
        <Feature
          eyebrow="Made in Pakistan"
          title={<>{housesLabel} fragrance houses, <span className="text-[#94aea7]">one directory.</span></>}
          body="Explore Pakistani perfumers and local brands — creative directors, catalogues and community reviews, all in one place."
          cta="Explore the houses"
          href="/mbp"
          visual={<HousesMosaic houses={houses} total={housesTotal} />}
          halo="#557d72"
          flip
          interactive
        />
        <Feature
          eyebrow="Free tools"
          title={<>Tools for <span className="text-[#94aea7]">the hobby.</span></>}
          body="Plan decants, estimate how much is left in a bottle, and cost an indie batch — built for the community, and free."
          cta="Open the tools"
          href="/tools/decant"
          visual={<ToolsStack />}
          halo="#2a5c4f"
        />
      </div>
    </LazyMotion>
  )
}

function Feature({ eyebrow, title, body, cta, href, visual, halo, flip = false, interactive = false }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const visualY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 48, reduce ? 0 : -48])
  const visualScale = useTransform(scrollYProgress, [0, 0.5, 1], [reduce ? 1 : 0.96, 1, reduce ? 1 : 0.98])

  const text = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({ opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.6, ease: EASE, delay: reduce ? 0 : 0.08 * i } }),
  }

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 h-[420px] w-[420px] rounded-full blur-3xl opacity-25"
        style={{ background: `radial-gradient(closest-side, ${halo}, transparent)`, top: '10%', [flip ? 'left' : 'right']: '-6rem' }}
      />
      <div className={`grid items-center gap-12 md:grid-cols-2 md:gap-16 ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <m.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <m.p custom={0} variants={text} className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">
            {eyebrow}
          </m.p>
          <m.h2 custom={1} variants={text} className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </m.h2>
          <m.p custom={2} variants={text} className="mt-6 max-w-md text-base leading-relaxed text-gray-400 sm:text-lg">
            {body}
          </m.p>
          <m.div custom={3} variants={text} className="mt-8">
            <Link
              href={href}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e6ebe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {cta}
              <ArrowRight className="h-4 w-4 transition-transform motion-safe:duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </m.div>
        </m.div>

        <m.div style={{ y: visualY, scale: visualScale }} className="will-change-transform" aria-hidden={interactive ? undefined : 'true'}>
          {visual}
        </m.div>
      </div>
    </section>
  )
}

/* ---------- Visual cards (decorative, aria-hidden by the wrapper) ---------- */

// Used only if the homepage could not load real sellers.
const FALLBACK_SELLERS = [{ name: 'Abdullah Nazir', code: 'AN-K9C7', type: 'BNIB Seller' }]
const IDLE_PLACEHOLDER = 'Seller name or code'

function VerifyCard({ sellers = [] }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const list = sellers.length ? sellers : FALLBACK_SELLERS
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [demo, setDemo] = useState(IDLE_PLACEHOLDER)
  const [shown, setShown] = useState(0)

  // While the field is empty and untouched, the placeholder types out a real
  // active seller's name; when the name is complete the result card below
  // switches to that seller. Stops on focus or input, and under reduced
  // motion the card simply shows one seller.
  useEffect(() => {
    if (reduce || focused || q) { setDemo(IDLE_PLACEHOLDER); return }
    let word = shown, i = 0, deleting = false, t
    const tick = () => {
      const target = list[word].name
      if (!deleting) {
        i += 1; setDemo(target.slice(0, i) + '|')
        if (i === target.length) { setShown(word); deleting = true; t = setTimeout(tick, 2200); return }
        t = setTimeout(tick, 85)
      } else {
        i -= 1; setDemo(target.slice(0, i) + '|')
        if (i === 0) { deleting = false; word = (word + 1) % list.length; t = setTimeout(tick, 350); return }
        t = setTimeout(tick, 35)
      }
    }
    t = setTimeout(tick, 700)
    return () => clearTimeout(t)
    // `shown` is read only to resume where the rotation left off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, focused, q, list])

  const seller = list[shown] || list[0]

  function submit(e) {
    e.preventDefault()
    const term = q.trim()
    router.push(term ? `/tools/verify-seller?q=${encodeURIComponent(term)}` : '/tools/verify-seller')
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <form onSubmit={submit} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 transition focus-within:border-white/30">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true">
          <path d="M21 21l-4.2-4.2M5 11a6 6 0 1012 0 6 6 0 00-12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <label htmlFor="home-verify-q" className="sr-only">Seller name or code</label>
        <input
          id="home-verify-q"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={demo}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={100}
          autoComplete="off"
          className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-[#e6ebe9] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Check
        </button>
      </form>
      <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5" aria-hidden="true">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Verified</p>
            {/* Crossfade: outgoing and incoming seller share one grid cell, so the
                card keeps its size while one dissolves into the other. */}
            <div className="grid">
              <AnimatePresence initial={false}>
                <m.div
                  key={seller.code}
                  style={{ gridArea: '1 / 1' }}
                  initial={reduce ? false : { opacity: 0, y: 4, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(4px)' }}
                  transition={{ duration: reduce ? 0 : 0.7, ease: [0.4, 0, 0.2, 1] }}
                  className="min-w-0"
                >
                  <p className="truncate text-lg font-bold text-[#F5F5F7]">{seller.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-[#F5F5F7]">{seller.code}</span>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">{seller.type}</span>
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HOUSES = [
  ['J.', '#2a5c4f'], ['SA', '#5c4a2a'], ['KH', '#2a3d5c'], ['AL', '#5c2a3d'], ['MN', '#3d6b5e'], ['RZ', '#6b5e3d'],
]

const ACCENT_PALETTE = ['#2a5c4f', '#5c4a2a', '#2a3d5c', '#5c2a3d', '#3d6b5e', '#6b5e3d']
function accentFor(name) {
  let n = 0
  for (let i = 0; i < (name || '').length; i++) n = (n * 31 + name.charCodeAt(i)) >>> 0
  return ACCENT_PALETTE[n % ACCENT_PALETTE.length]
}
function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

// Real houses from the directory, best-presented first (logo + description);
// falls back to the decorative mosaic when the build had no data.
function HousesMosaic({ houses, total }) {
  if (!houses || houses.length === 0) return <FallbackMosaic />
  const more = Math.max(0, (total || 0) - houses.length)
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3">
      {houses.slice(0, 6).map((hs) => (
        <Link
          key={hs.slug}
          href={`/houses/${hs.slug}`}
          className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center shadow-lg shadow-black/30 transition hover:border-white/25 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <div className="mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white/5">
            {hs.logo_url
              ? <img src={hs.logo_url} alt={hs.house} loading="lazy" className="h-full w-full object-contain p-2" />
              : <span className="text-lg font-bold" style={{ color: lighten(accentFor(hs.house)) }}>{initials(hs.house)}</span>}
          </div>
          <p className="mt-2 truncate text-xs font-semibold text-[#F5F5F7]">{hs.house}</p>
          {hs.description && (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-400">{hs.description}</p>
          )}
        </Link>
      ))}
      {more > 0 && (
        <div className="col-span-3 mt-1 flex items-center justify-center gap-2 text-xs text-white/50">
          <Building2 className="h-3.5 w-3.5" /> and {more} more in the directory
        </div>
      )}
    </div>
  )
}

function FallbackMosaic() {
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3">
      {HOUSES.map(([ini, accent], i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-2xl border text-lg font-bold shadow-lg shadow-black/30"
          style={{ backgroundColor: accent + '28', borderColor: accent + '55', color: lighten(accent) }}
        >
          {ini}
        </div>
      ))}
    </div>
  )
}

function lighten(hex) {
  const n = parseInt(hex.slice(1, 7), 16)
  const mix = (c) => Math.round(c + (255 - c) * 0.55).toString(16).padStart(2, '0')
  return '#' + mix(n >> 16) + mix((n >> 8) & 255) + mix(n & 255)
}

const TOOLS = [
  { icon: Droplets, name: 'Decant calculator', sub: 'Split a bottle, price each decant' },
  { icon: Ruler, name: 'Bottle level', sub: 'Estimate the mL left' },
  { icon: FlaskConical, name: 'Indie lab', sub: 'Cost and batch a formula' },
]

function ToolsStack() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      {TOOLS.map(({ icon: Icon, name, sub }, i) => (
        <div
          key={name}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-lg shadow-black/30 backdrop-blur"
          style={{ marginLeft: `${i * 14}px`, marginRight: `${(2 - i) * 14}px` }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2a5c4f]/30 text-[#94aea7] ring-1 ring-[#94aea7]/20">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#F5F5F7]">{name}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
