import Image from "next/image";

export default function Home() {
  return (
<<<<<<< HEAD
    <main className="bg-black text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="PFC Logo" width={36} height={36} />
          <span className="text-lg font-semibold">PFC</span>
=======
    <main className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="PFC Logo" width={40} height={40} />
          <h1 className="text-xl font-bold">Pakistan Fragrance Community</h1>
>>>>>>> f0ab36f5416bf64e002d52e9d03f191137191c91
        </div>
        <nav className="space-x-6 text-sm">
          <a href="/" className="hover:underline">Home</a>
          <a href="/blog" className="hover:underline">Blog</a>
          <a href="/reviews" className="hover:underline">Reviews</a>
        </nav>
      </header>

<<<<<<< HEAD
      {/* Hero */}
      <section className="h-screen w-full bg-cover bg-center flex items-center justify-center text-center relative" style={{ backgroundImage: 'url(/hero.jpg)' }}>
        <div className="bg-black bg-opacity-60 p-8 rounded-lg">
          <h1 className="text-5xl font-bold mb-4">Smell Better. Live Better.</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Pakistan’s premier fragrance community — reviews, splits, and everything in between.</p>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-24 px-6 space-y-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Image src="/feature1.jpg" alt="Discover" width={600} height={400} className="rounded-lg" />
          <div>
            <h2 className="text-3xl font-semibold mb-2">Discover Your Signature Scent</h2>
            <p className="text-gray-400">Explore niche and designer perfumes trusted by real enthusiasts. We help you find what fits.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center flex-row-reverse">
          <Image src="/feature2.jpg" alt="Join" width={600} height={400} className="rounded-lg" />
          <div>
            <h2 className="text-3xl font-semibold mb-2">Join a Trusted Community</h2>
            <p className="text-gray-400">Connect with thousands of fragrance lovers, decanters, and verified sellers across Pakistan.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Image src="/feature3.jpg" alt="Review" width={600} height={400} className="rounded-lg" />
          <div>
            <h2 className="text-3xl font-semibold mb-2">Read & Share Honest Reviews</h2>
            <p className="text-gray-400">Get genuine opinions, share your take, and never blind-buy again.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center p-6 border-t border-gray-800 text-sm text-gray-500 bg-black">
=======
      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">Welcome to PFC</h2>
        <p className="text-lg text-gray-300">
          Pakistan’s first and most vibrant perfume community. Discover new fragrances, share reviews, and buy/sell genuine perfumes with fellow enthusiasts across Pakistan.
        </p>
      </section>

      {/* Placeholder Blog Section */}
      <section className="py-12 px-6 border-t border-gray-800 text-center">
        <h3 className="text-2xl font-semibold mb-4">Latest Blog Posts</h3>
        <p className="text-gray-400">Coming soon...</p>
      </section>

      {/* Placeholder Reviews Section */}
      <section className="py-12 px-6 border-t border-gray-800 text-center">
        <h3 className="text-2xl font-semibold mb-4">Latest Perfume Reviews</h3>
        <p className="text-gray-400">Coming soon...</p>
      </section>

      {/* Footer */}
      <footer className="text-center p-4 border-t border-gray-700 text-sm text-gray-500 mt-10">
>>>>>>> f0ab36f5416bf64e002d52e9d03f191137191c91
        &copy; {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.
      </footer>
    </main>
  );
}
