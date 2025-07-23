import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="PFC Logo" width={48} height={48} />
          <span className="text-lg font-semibold tracking-wide">PFC</span>
        </div>
        <nav className="space-x-6 text-sm">
          <a href="/" className="hover:underline">Home</a>
          <a href="/blog" className="hover:underline">Blog</a>
          <a href="/reviews" className="hover:underline">Reviews</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Image */}
        <Image
          src="/hero.jpg"
          alt="Fragrance Hero"
          layout="fill"
          objectFit="cover"
          objectPosition="center"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>

        {/* Title */}
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            The Home of Fragrance Enthusiasts
          </h1>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center p-6 border-t border-gray-800 text-sm text-gray-500 bg-black">
        &copy; {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.
      </footer>
    </div>
  );
}
