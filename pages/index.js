import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="PFC Logo" width={40} height={40} />
          <h1 className="text-xl font-bold">Pakistan Fragrance Community</h1>
        </div>
        <nav className="space-x-6 text-sm">
          <a href="/" className="hover:underline">Home</a>
          <a href="/blog" className="hover:underline">Blog</a>
          <a href="/reviews" className="hover:underline">Reviews</a>
        </nav>
      </header>

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
        &copy; {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.
      </footer>
    </main>
  );
}
