'use client'
import { urlFor } from '../../lib/image'

export default function ReviewCard({ perfume, review }) {
  const hero = perfume?.hero ? urlFor(perfume.hero).width(1200).height(800).url() : null
  const r = review?.ratings || {}

  return (
    <section className="grid md:grid-cols-3 gap-6 rounded-2xl p-6 bg-[#0b0b0b] border border-neutral-800">
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-3xl font-semibold">
          {perfume?.brand?.name} {perfume?.name}
        </h1>

        {review?.summary ? <p className="text-neutral-300">{review.summary}</p> : null}

        {(review?.pros?.length || review?.cons?.length) ? (
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            {review?.pros?.length ? (
              <div className="bg-emerald-900/30 border border-emerald-800 rounded-xl p-3 flex-1">
                <div className="font-medium">Pros</div>
                <ul className="list-disc ml-5">{review.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            ) : null}
            {review?.cons?.length ? (
              <div className="bg-rose-900/30 border border-rose-800 rounded-xl p-3 flex-1">
                <div className="font-medium">Cons</div>
                <ul className="list-disc ml-5">{review.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            ['Brand', perfume?.brand?.name],
            ['Concentration', perfume?.concentration?.toUpperCase?.()],
            ['Perfumer', perfume?.perfumer],
            ['Launch', perfume?.launchYear],
            ['Family', perfume?.family],
          ].map(([k, v]) =>
            v ? (
              <div key={k} className="bg-neutral-800/60 rounded-lg p-2">
                <span className="text-neutral-400">{k}:</span> {String(v)}
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="space-y-3">
        {hero ? <img src={hero} alt={perfume?.name} className="rounded-xl w-full object-cover" /> : null}
        {typeof r?.overall === 'number' ? (
          <div className="text-center rounded-xl p-4 bg-neutral-800/60">
            <div className="text-xs text-neutral-400">Overall</div>
            <div className="text-4xl font-bold">{Number(r.overall).toFixed(1)}</div>
            <div className="text-xs text-neutral-500">/ 10</div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
