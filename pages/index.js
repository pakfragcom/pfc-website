import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-black text-white font-sans">
    <header className="fixed top-0 left-0 w-full z-50 px-10 py-2 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-gray-800 h-[80px]">
  {/* Larger Logo */}
  <div className="flex items-center">
    <Image
      src="/logo.png"
      alt="PFC Logo"
      width={120}
      height={60}
      className="object-contain"
    />
  </div>

  {/* Clean Navigation */}
  <nav className="space-x-8 text-sm uppercase tracking-wide">
    <a href="/" className="hover:text-gray-300 transition">Home</a>
    <a href="/blog" className="hover:text-gray-300 transition">Blog</a>
    <a href="/reviews" className="hover:text-gray-300 transition">Reviews</a>
  </nav>
</header>


  {/* Refined nav */}
  <nav className="space-x-8 text-sm uppercase tracking-wide">
    <a href="/" className="hover:text-gray-300 transition">Home</a>
    <a href="/blog" className="hover:text-gray-300 transition">Blog</a>
    <a href="/reviews" className="hover:text-gray-300 transition">Reviews</a>
  </nav>
</header>


      {/* Hero */}
      <section className="relative h-screen w-full flex items-center justify-center">
        <Image
          src="/hero.jpg"
          alt="Hero Image"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        <div className="relative z-10 px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-light tracking-widest uppercase">
            The Home of Fragrance Enthusiasts
          </h1>
        </div>
      </section>

      {/* Intro Section */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 uppercase">
          Welcome to Pakistan Fragrance Community
        </h2>
        <p className="text-gray-300 text-base leading-relaxed">
          PFC is the premier and first official community devoted to fragrances in Pakistan.
          We connect perfume lovers, collectors, reviewers, and decanters — all under one authentic platform.
        </p>
      </section>

      {/* Split Block (Image Left / Text Right) */}
      <section className="flex flex-col md:flex-row items-center max-w-6xl mx-auto px-6 py-16 space-y-10 md:space-y-0 md:space-x-12">
        <div className="w-full md:w-1/2">
          <Image
            src="/hero.jpg"
            alt="Fragrance Visual"
            width={800}
            height={600}
            className="rounded-lg shadow-lg"
          />
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

      {/* Footer */}
      <footer className="text-center p-6 border-t border-gray-800 text-sm text-gray-500 bg-black mt-20">
        &copy; {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.
      </footer>
    </div>
  );
}
