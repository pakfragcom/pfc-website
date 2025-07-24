import Image from 'next/image'

export default function SplitBlock() {
  return (
    <section className="flex flex-col md:flex-row items-center max-w-6xl mx-auto px-6 py-16 space-y-10 md:space-y-0 md:space-x-12">
      <div className="w-full md:w-1/2">
        <Image src="/hero.jpg" alt="Fragrance Visual" width={800} height={600} className="rounded-lg shadow-lg" />
      </div>
      <div className="w-full md:w-1/2 text-left">
        <h3 className="text-xl md:text-2xl font-semibold mb-4 uppercase tracking-wider">
          Discover. Review. Trade.
        </h3>
        <p className="text-gray-300 text-base leading-relaxed">
          Whether you're looking for your next signature scent or want to share your experience,
          PFC is the trusted hub for perfume enthusiasts across Pakistan.
          Join our Facebook community, read real reviews, and explore our upcoming marketplace.
        </p>
      </div>
    </section>
  )
}
