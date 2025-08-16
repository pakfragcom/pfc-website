import { groq } from 'next-sanity'
import { client } from '../../lib/sanity.client'
import ReviewCard from '../../components/reviews/ReviewCard'
import WhatsAppCTA from '../../components/reviews/WhatsAppCTA'

const PERFUME_SLUGS = groq`*[_type=="perfume" && defined(slug.current)][].slug.current`

const PERFUME_BY_SLUG = groq`
*[_type=="perfume" && slug.current==$slug][0]{
  _id, name, slug, concentration, perfumer, launchYear, family,
  accords, topNotes, heartNotes, baseNotes, longevityHours, sillageMeters,
  seasonality, genderLean, sprayAdvice, batchInfo, ifraStatus, allergens, priceRange,
  "brand": brand-> {name, slug},
  hero, gallery
}
`

const REVIEW_FOR_PERFUME = groq`
*[_type=="review" && references(^._id)][0]{
  headline, summary, pros, cons, ratings, whoFor, testing, updateLog, body
}
`

export async function getStaticPaths() {
  const slugs = await client.fetch(PERFUME_SLUGS)
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const perfume = await client.fetch(PERFUME_BY_SLUG, { slug: params.slug })
  if (!perfume) return { notFound: true }

  // We fetch a review referencing this perfume (optional)
  const review = await client.fetch(REVIEW_FOR_PERFUME, { _id: perfume._id })

  // Revalidate so new Studio publishes show up quickly
  return { props: { perfume, review: review || null }, revalidate: 60 }
}

export default function PerfumePage({ perfume, review }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <ReviewCard perfume={perfume} review={review} />

      {/* Personas */}
      {review?.whoFor?.length ? (
        <section className="rounded-2xl p-6 bg-[#0b0b0b] border border-neutral-800">
          <h2 className="text-xl font-semibold mb-3">Who is this for?</h2>
          <div className="flex flex-wrap gap-2">
            {review.whoFor.map((p, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-neutral-800 text-sm">{p}</span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Performance */}
      {(perfume?.longevityHours || perfume?.sillageMeters) ? (
        <section className="rounded-2xl p-6 bg-[#0b0b0b] border border-neutral-800 space-y-4">
          <h2 className="text-xl font-semibold">Performance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {perfume?.longevityHours ? <Bar label="Longevity (hrs)" value={perfume.longevityHours} max={24} /> : null}
            {perfume?.sillageMeters ? <Bar label="Sillage (m)" value={perfume.sillageMeters} max={5} /> : null}
          </div>
        </section>
      ) : null}

      {/* Specs */}
      <Specs perfume={perfume} />

      {/* About this review */}
      {(review?.testing || review?.updateLog?.length) ? (
        <section className="rounded-2xl p-6 bg-[#0b0b0b] border border-neutral-800 space-y-3">
          <h2 className="text-xl font-semibold">About this review</h2>
          {review?.testing ? (
            <div className="text-sm grid md:grid-cols-3 gap-3">
              {review.testing.bottleSource && <div><span className="text-neutral-400">Bottle:</span> {review.testing.bottleSource}</div>}
              {review.testing.testingPeriod && <div><span className="text-neutral-400">Period:</span> {review.testing.testingPeriod}</div>}
              {review.testing.climate && <div><span className="text-neutral-400">Climate:</span> {review.testing.climate}</div>}
            </div>
          ) : null}
          {review?.updateLog?.length ? (
            <div className="text-sm">
              <div className="text-neutral-400 mb-1">Update log</div>
              <ul className="list-disc ml-5">
                {review.updateLog.map((u, i) => <li key={i}>{u.date}: {u.note}</li>)}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <WhatsAppCTA perfume={perfume} phone="+92XXXXXXXXXX" />
    </main>
  )
}

/* Local helpers */
function Bar({ label, value, max }) {
  const pct = Math.min(100, (Number(value) / Number(max)) * 100)
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-neutral-300">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded">
        <div className="h-2 rounded bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Specs({ perfume }) {
  const rows = [
    ['Accords', perfume?.accords?.join(', ')],
    ['Top', perfume?.topNotes?.join(', ')],
    ['Heart', perfume?.heartNotes?.join(', ')],
    ['Base', perfume?.baseNotes?.join(', ')],
    ['Seasonality', perfume?.seasonality?.join(', ')],
    ['Gender lean', perfume?.genderLean],
    ['Spray advice', perfume?.sprayAdvice],
    ['Batch', perfume?.batchInfo],
    ['IFRA', perfume?.ifraStatus],
    ['Allergens', perfume?.allergens?.join(', ')],
    ['Price (PKR)', perfume?.priceRange],
  ].filter(([, v]) => v)
  if (!rows.length) return null

  return (
    <section className="rounded-2xl p-6 bg-[#0b0b0b] border border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">Notes & Specs</h2>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex">
            <div className="w-32 text-neutral-400">{k}</div>
            <div className="flex-1">{v}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
