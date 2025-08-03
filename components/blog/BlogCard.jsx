import Link from 'next/link'

export default function ForumCard({ post }) {
  const { slug, title, publishedAt } = post

  return (
    <div className="bg-black/30 backdrop-blur rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:shadow-xl transition">
      <Link href={`https://forum.pakfrag.com/${slug?.current || ''}`} target="_blank" rel="noopener noreferrer">
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{new Date(publishedAt).toLocaleDateString()}</p>
        </div>
      </Link>
    </div>
  )
}
