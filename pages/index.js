import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-black text-white font-sans">
      {/* Header */}
     <header className="fixed top-0 left-0 w-full z-50 px-6 md:px-10 h-[80px] flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-gray-800">
  {/* Left: Logo */}
  <div className="flex items-center">
    <Image
      src="/logo.png"
      alt="PFC Logo"
      width={110}
      height={60}
      className="object-contain"
    />
  </div>

  {/* Center: Nav */}
  <nav className="hidden md:flex space-x-8 text-sm uppercase tracking-wide">
    <a href="/" className="hover:text-gray-300 transition">Home</a>
    <a href="/blog" className="hover:text-gray-300 transition">Blog</a>
    <a href="/reviews" className="hover:text-gray-300 transition">Reviews</a>
  </nav>

  {/* Right: Social Icons */}
  <div className="flex items-center space-x-4">
    <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5 hover:opacity-80 transition">
        <path d="M22.675 0h-21.35C.592 0 0 .593 0 1.326v21.348C0 23.407.592 24 1.325 24h11.483V14.708h-3.13v-3.622h3.13V8.413c0-3.1 1.893-4.788 4.658-4.788 1.325 0 2.464.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.59l-.467 3.622h-3.123V24h6.116C23.408 24 24 23.407 24 22.674V1.326C24 .593 23.408 0 22.675 0z" />
      </svg>
    </a>
    <a href="https://www.instagram.com/pakfragcom/" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5 hover:opacity-80 transition">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.423.403a4.92 4.92 0 011.675 1.09 4.92 4.92 0 011.09 1.675c.163.453.35 1.253.403 2.423.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.423a4.92 4.92 0 01-1.09 1.675 4.92 4.92 0 01-1.675 1.09c-.453.163-1.253.35-2.423.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.423-.403a4.92 4.92 0 01-1.675-1.09 4.92 4.92 0 01-1.09-1.675c-.163-.453-.35-1.253-.403-2.423-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.423a4.92 4.92 0 011.09-1.675 4.92 4.92 0 011.675-1.09c.453-.163 1.253-.35 2.423-.403 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.332.013 7.053.07 5.773.127 4.755.308 3.95.558a7.017 7.017 0 00-2.548 1.64A7.017 7.017 0 00.558 4.828c-.25.805-.431 1.823-.488 3.103C.013 8.332 0 8.741 0 12c0 3.259.013 3.668.07 4.947.057 1.28.238 2.298.488 3.103a7.017 7.017 0 001.64 2.548 7.017 7.017 0 002.548 1.64c.805.25 1.823.431 3.103.488 1.279.057 1.688.07 4.947.07s3.668-.013 4.947-.07c1.28-.057 2.

        {/* Clean Navigation */}
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
