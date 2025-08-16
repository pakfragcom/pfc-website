import Link from 'next/link'
import { groq } from 'next-sanity'
import { client } from '../../lib/sanity.client'
import { urlFor } from '../../lib/image'

export async function getStaticProps() {
  const data = await client.fetch(groq`
    *[_type=="perfume"]|order(name asc){
      name, slug, brand-> {name}, hero
    }`)
  return { props: { data }, revalidate: 60 }
}

export default function PerfumesIndex({ data }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-semibold">Perfumes</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data?.map((p) => (
          <Link key={p.slug.current} href={`/perfumes/${p.slug.current}`} className="group rounded-xl overflow-hidden border border-neutral-800">
            {p.hero && <img className="w-full h-48 object-cover" src={urlFor(p.hero).width(600).height(400).url()} alt={p.name} />}
            <div className="p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-neutral-400">{p.brand?.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
