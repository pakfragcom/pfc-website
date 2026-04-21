import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { supabase } from '../../lib/supabase'

const STAR = '★'
const STAR_EMPTY = '☆'

function Stars({ rating, max = 5, size = 'sm' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const cls = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
  return (
    <span className={`${cls} leading-none`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < full ? 'text-amber-400' : 'text-gray-700'}>
          {STAR}
        </span>
      ))}
    </span>
  )
}

function RatingBar({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#94aea7]"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-4 text-right">{value}</span>
    </div>
  )
}

export default function HousePage({ house, reviews = [], stats }) {
  if (!house) return null

  const hasReviews = reviews.length > 0
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `https://pakfrag.com/houses/${house.slug}#org`,
        name: house.house,
        url: `https://pakfrag.com/houses/${house.slug}`,
        description: house.description || `${house.house} is a PFC-verified Pakistani fragrance house${house.director ? ` led by ${house.director}` : ''}.`,
        ...(house.established_year && { foundingDate: String(house.established_year) }),
        ...(house.city && { address: { '@type': 'PostalAddress', addressLocality: house.city, addressCountry: 'PK' } }),
        ...(hasReviews && stats.count >= 1 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: stats.avg.toFixed(1),
            reviewCount: stats.count,
            bestRating: '5',
            worstRating: '1',
          },
        }),
        ...(hasReviews && {
          review: reviews.slice(0, 5).map(r => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: String(r.rating_overall) },
            author: { '@type': 'Person', name: r.profiles?.display_name || 'PFC Member' },
            reviewBody: r.review_text?.slice(0, 300),
            datePublished: r.published_at?.slice(0, 10),
          })),
        }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pakfrag.com' },
          { '@type': 'ListItem', position: 2, name: 'Local Houses', item: 'https://pakfrag.com/local-houses' },
          { '@type': 'ListItem', position: 3, name: house.house, item: `https://pakfrag.com/houses/${house.slug}` },
        ],
      },
    ],
  }

  const tierLabel = { platinum: 'Platinum Club', gold: 'Gold Club', silver: 'Silver Club' }[house.tier] || ''
  const pageTitle = `${house.house} Reviews — ${tierLabel ? tierLabel + ' · ' : ''}Pakistani Fragrance House | PFC`
  const pageDesc = house.description
    ? `${house.description.slice(0, 140)}…`
    : `Read community reviews of ${house.house}${house.director ? `, led by ${house.director}` : ''} — a PFC-verified Pakistani fragrance brand.`

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://pakfrag.com/houses/${house.slug}`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://pakfrag.com/houses/${house.slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </Head>

      <div className="bg-black min-h-screen text-white">
        <Header />

        <main className="pt-20">
          {/* Hero band */}
          <div className="relative overflow-hidden border-b border-white/10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/4 -translate-x-1/2 top-0 h-64 w-96 rounded-full bg-[#2a5c4f]/10 blur-3xl" />
              <div className="absolute right-1/4 translate-x-1/2 bottom-0 h-48 w-64 rounded-full bg-[#94aea7]/8 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 py-14 relative">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-gray-600 mb-6" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-gray-400 transition">Home</Link>
                <span>/</span>
                <Link href="/local-houses" className="hover:text-gray-400 transition">Local Houses</Link>
                <span>/</span>
                <span className="text-gray-400">{house.house}</span>
              </nav>

              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                {/* Avatar initials circle */}
                <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2a5c4f] to-[#557d72] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#2a5c4f]/20">
                  {house.house.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Tier + verified badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {house.tier === 'platinum' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                        🏆 Platinum Club
                      </span>
                    )}
                    {house.tier === 'gold' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-400 ring-1 ring-yellow-500/20">
                        🥇 Gold Club
                      </span>
                    )}
                    {house.tier === 'silver' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 ring-1 ring-slate-400/20">
                        🥈 Silver Club
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/25">
                      ✓ PFC Verified
                    </span>
                    {house.established_year && (
                      <span className="text-[11px] text-gray-600">Est. {house.established_year}</span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{house.house}</h1>

                  {house.director && (
                    <p className="mt-1 text-sm text-gray-400">
                      Creative Director: <span className="text-gray-200">{house.director}</span>
                    </p>
                  )}
                  {house.city && (
                    <p className="mt-0.5 text-sm text-gray-500">{house.city}, Pakistan</p>
                  )}

                  {/* Aggregate rating bar */}
                  {hasReviews && (
                    <div className="mt-4 flex items-center gap-3">
                      <Stars rating={stats.avg} size="md" />
                      <span className="text-lg font-semibold text-white">{stats.avg.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">
                        {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {house.description && (
                    <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-2xl">{house.description}</p>
                  )}

                  {/* Social/web links */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {house.instagram && (
                      <a href={`https://instagram.com/${house.instagram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M7.5 2h9A5.5 5.5 0 0122 7.5v9A5.5 5.5 0 0116.5 22h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 1.8A3.7 3.7 0 003.8 7.5v9a3.7 3.7 0 003.7 3.7h9a3.7 3.7 0 003.7-3.7v-9A3.7 3.7 0 0016.5 3.8h-9zm4.5 2.9a5.8 5.8 0 100 11.6 5.8 5.8 0 000-11.6zm0 1.8a4 4 0 110 8 4 4 0 010-8zm5-1.3a.95.95 0 100 1.9.95.95 0 000-1.9z"/>
                        </svg>
                        @{house.instagram.replace('@', '')}
                      </a>
                    )}
                    {house.website && (
                      <a href={house.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                        </svg>
                        Website
                      </a>
                    )}
                    <Link href={`/reviews/submit?category=local&house=${encodeURIComponent(house.house)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#2a5c4f]/20 hover:brightness-110 transition">
                      + Write a Review
                    </Link>
                    <Link href={`/fragrances?q=${encodeURIComponent(house.house)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/30 transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
                      </svg>
                      Browse Fragrances
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews section */}
          <div className="mx-auto max-w-4xl px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Community Reviews
                {hasReviews && <span className="ml-2 text-sm font-normal text-gray-500">({stats.count})</span>}
              </h2>
              {hasReviews && (
                <Link href={`/reviews/submit?category=local&house=${encodeURIComponent(house.house)}`}
                  className="text-sm text-[#94aea7] hover:text-white transition">
                  Write a Review →
                </Link>
              )}
            </div>

            {!hasReviews ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-8 py-16 text-center">
                <div className="text-4xl mb-4">🌿</div>
                <h3 className="text-base font-semibold text-white mb-2">No reviews yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  Be the first PFC member to share your experience with {house.house}.
                </p>
                <Link href={`/reviews/submit?category=local&house=${encodeURIComponent(house.house)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2a5c4f]/20 hover:brightness-110 transition">
                  Write the First Review
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <Link key={review.id} href={`/reviews/${review.slug}`}
                    className="group block rounded-2xl border border-white/8 bg-white/[0.03] p-6 hover:border-white/20 hover:bg-white/[0.05] transition">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-[#2a5c4f]/60 to-[#94aea7]/60 flex items-center justify-center text-xs font-bold text-white">
                        {(review.profiles?.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white group-hover:text-[#94aea7] transition text-sm">
                            {review.fragrance_name}
                          </span>
                          <Stars rating={review.rating_overall} />
                          <span className="text-amber-400 text-xs font-medium">{Number(review.rating_overall).toFixed(1)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          By {review.profiles?.display_name || 'PFC Member'}
                          {review.profiles?.city && ` · ${review.profiles.city}`}
                          {' · '}{new Date(review.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-3">
                          {review.review_text}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-3 max-w-xs">
                          <RatingBar label="Longevity" value={review.rating_longevity} />
                          <RatingBar label="Sillage" value={review.rating_sillage} />
                          <RatingBar label="Value" value={review.rating_value} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination hint */}
            {reviews.length >= 20 && (
              <p className="mt-6 text-center text-xs text-gray-600">Showing 20 most recent reviews</p>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const { data } = await supabase
    .from('fragrance_houses')
    .select('slug')
    .in('status', ['active', 'grace'])

  return {
    paths: (data || []).map(h => ({ params: { slug: h.slug } })),
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params

  // Fetch house (use admin client to bypass RLS for the page build, but data is public)
  const { data: house } = await supabase
    .from('fragrance_houses')
    .select('id, house, slug, director, city, description, established_year, instagram, website, status, tier')
    .eq('slug', slug)
    .single()

  if (!house || !['active', 'grace'].includes(house.status)) {
    return { notFound: true }
  }

  // Fetch approved reviews for this house
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, slug, fragrance_name, rating_overall, rating_longevity, rating_sillage, rating_value, review_text, published_at, profiles(display_name, city)')
    .eq('house_id', house.id)
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(20)

  // Compute aggregate stats
  const stats = reviews?.length
    ? {
        count: reviews.length,
        avg: reviews.reduce((s, r) => s + Number(r.rating_overall), 0) / reviews.length,
      }
    : { count: 0, avg: 0 }

  return {
    props: {
      house,
      reviews: reviews || [],
      stats,
    },
    revalidate: 300,
  }
}
