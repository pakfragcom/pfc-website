import Link from 'next/link'
import Image from 'next/image'

export default function BlogCard({ post }) {
  const { slug, title, excerpt, mainImage, publishedAt } = post

  return (
    <div className="bg-black/30 backdrop-blur rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:shadow-xl transition">
      <Link href={`/blog/${slug.current}`}>
        <div className="relative w-full h-52">
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{new Date(publishedAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-300">{excerpt}</p>
        </div>
      </Link>
    </div>
  )
}
