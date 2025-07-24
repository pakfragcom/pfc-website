import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center">
      <Image src="/hero.jpg" alt="Hero Image" layout="fill" objectFit="cover" priority />
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <div className="relative z-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-light tracking-widest uppercase mb-6">
          The Home of Fragrance Enthusiasts
        </h1>
        <a
          href="https://www.facebook.com/groups/pkfragcom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 border border-gray-500 rounded-full text-sm uppercase tracking-wide text-white bg-black/60 backdrop-blur-sm hover:bg-black/80 transition"
        >
          Join the Community
        </a>
      </div>
    </section>
  )
}
