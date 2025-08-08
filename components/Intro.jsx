export default function Intro() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-24 text-center">
      {/* Subtle background accent */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2a5c4f]/10 blur-3xl" />

      {/* Heading */}
      <h2 className="mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-bold uppercase tracking-wide text-transparent sm:text-3xl">
        Welcome to Pakistan Fragrance Community
      </h2>

      {/* Paragraph */}
      <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg">
        PFC is the premier and first official fragrance community in Pakistan — 
        connecting perfume lovers, collectors, reviewers, and decanters under one 
        authentic platform. Our mission is to elevate scent culture, build trust, and 
        inspire a new generation of fragrance enthusiasts.
      </p>

      {/* Stats row */}
      <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        {[
          { label: 'Members', value: '1 Lac+' },
          { label: 'Verified Sellers', value: '100+' },
          { label: 'Reviews', value: 'Countless' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-lg font-semibold text-white">{stat.value}</span>
            <span className="text-xs uppercase tracking-wide text-white/50">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
