import Image from 'next/image'

export default function ReviewCard({ review }) {
  const { perfumeName, rating, notes, image } = review

  return (
    <div className="bg-black/30 backdrop-blur border border-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0 rounded overflow-hidden border border-gray-700">
          <Image
            src={image}
            alt={perfumeName}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-white font-semibold">{perfumeName}</h3>
          <p className="text-gray-400 text-sm">Rating: {rating}/5</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-300">{notes}</p>
    </div>
  )
}
