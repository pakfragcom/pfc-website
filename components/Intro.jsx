// app/components/Intro.tsx (or wherever you keep it)
import Link from "next/link";

export default function Intro() {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid + vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        style={{
          backgroundImage: `
            radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,0.25), transparent 60%),
            linear-gradient(transparent 0, rgba(0,0,0,.6) 100%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0px, rgba(255,255,255,.06) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0px, rgba(255,255,255,.06) 1px, transparent 1px, transparent 40px)
          `,
        }}
      />

      {/* Accent glow blobs */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 sm:py-28 text-center">
        {/* Tiny badge */}
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium tracking-wide text-white/80">
            Pakistan’s Original Fragrance Community
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl leading-tight
          bg-gradient-to-b from-white to-white/60">
          Welcome to Pakistan Fragrance Community
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          PFC is the premier, authentic hub for perfume lovers, collectors, reviewers, and decanters in Pakistan—designed
          to elevate knowledge, trust, and discovery under one platform.
        </p>

        {/* Action row */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/join"
            className="group inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium
              bg-white text-gray-900 hover:bg-white/90 transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Join the Community
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.293 3.293a1 1 0 011.414 0l4.999 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
            </svg>
          </Link>

          <Link
            href="/reviews"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium
              border border-white/15 bg-white/5 text-white hover:bg-white/10 transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Read Reviews
          </Link>
        </div>

        {/* Social proof / KPI strip */}
        <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-white/50">Members</dt>
              <dd className="mt-1 text-lg font-semibold text-white">25k+</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-white/50">Verified Sellers</dt>
              <dd className="mt-1 text-lg font-semibold text-white">150+</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-white/50">Reviews</dt>
              <dd className="mt-1 text-lg font-semibold text-white">5,000+</dd>
            </div>
          </dl>
        </div>

        {/* Micro trust note */}
        <p className="mt-4 text-xs text-white/50">
          Curated by PFC moderators • No paid shills • Transparent community standards
        </p>
      </div>

      {/* Subtle top border sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </section>
  );
}
