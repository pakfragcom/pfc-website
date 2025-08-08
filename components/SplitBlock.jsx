import Link from "next/link";
import Image from "next/image";

export default function SplitBlock() {
  return (
    <section
      // Set your brand color once here (fallback is emerald). Use any hex.
      style={{ ["--brand" as any]: "#10b981" }}
      className="relative isolate mx-auto max-w-7xl px-6 py-20 md:py-28"
      aria-labelledby="pfc-splitblock-title"
    >
      {/* Background flair */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* soft grid */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <svg className="h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" fill="none" stroke="white" strokeOpacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* gradient halos */}
        <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(closest-side, var(--brand), transparent)" }} />
        <div className="absolute -bottom-16 -right-12 h-64 w-64 rounded-full blur-3xl opacity-20"
             style={{ background: "radial-gradient(closest-side, var(--brand), transparent)" }} />
      </div>

      <div className="flex flex-col items-center gap-12 md:flex-row md:items-stretch">
        {/* Visual */}
        <div className="w-full md:w-1/2">
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <Image
              src="/hero.jpg"
              alt="PFC — Pakistan’s fragrance community"
              width={1200}
              height={900}
              priority
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            {/* subtle top gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            {/* floating label */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-wider text-white/80 backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "var(--brand)" }} />
              Community Powered
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full md:w-1/2">
          <div className="relative h-full rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl backdrop-blur md:p-10">
            {/* eyebrow */}
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-white/60">
              Pakistan Fragrance Community
            </p>

            <h3 id="pfc-splitblock-title" className="mb-4 text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-white">Discover.</span>{" "}
              <span className="text-white">Review.</span>{" "}
              <span className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(90deg, var(--brand), #ffffff)" }}>
                Trade.
              </span>
            </h3>

            <p className="mb-8 text-base leading-relaxed text-white/70">
              Whether you’re finding a signature scent or sharing your take,
              <span className="text-white/90"> PFC</span> is the trusted hub for perfume
              enthusiasts across Pakistan. Join our Facebook community, read real reviews,
              and get ready for our upcoming marketplace.
            </p>

            {/* Trust stats */}
            <dl className="mb-8 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <dt className="text-[10px] uppercase tracking-wider text-white/60">Members</dt>
                <dd className="mt-1 text-lg font-semibold text-white">25k+</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <dt className="text-[10px] uppercase tracking-wider text-white/60">Verified Sellers</dt>
                <dd className="mt-1 text-lg font-semibold text-white">150+</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4">
                <dt className="text-[10px] uppercase tracking-wider text-white/60">Reviews</dt>
                <dd className="mt-1 text-lg font-semibold text-white">5,000+</dd>
              </div>
            </dl>

            {/* Feature bullets */}
            <ul className="mb-8 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-3">
                <CheckIcon />
                Curated discussions & real‑world wear tests
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                Seller verification & safer trading guidelines
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                Marketplace (coming soon) with dispute support
              </li>
            </ul>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="https://facebook.com" // TODO: replace with your community URL
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-black transition
                           hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ background: "linear-gradient(90deg, var(--brand), #22d3ee)" }}
              >
                Join the Community
              </Link>

              <Link
                href="/reviews"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90
                           transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Read Reviews
              </Link>

              <Link
                href="/sell"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90
                           transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Become a Seller
              </Link>
            </div>

            {/* tiny footer note */}
            <p className="mt-4 text-[11px] text-white/40">
              Tip: Press <kbd className="rounded border border-white/20 bg-black/40 px-1.5">/</kbd> to search fragrances.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Inline SVG icon (no extra deps) */
function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 7L10 17l-6-6" stroke="currentColor" strokeWidth="2" className="text-white/70" />
      <circle cx="12" cy="12" r="11" className="text-white/10" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </svg>
  );
}
