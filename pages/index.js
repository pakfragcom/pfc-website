import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-black text-white font-sans">
   <header className="fixed top-0 left-0 w-full z-50 h-[80px] bg-black/50 backdrop-blur-md border-b border-gray-800 flex items-center px-10">
  <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto">
    
    {/* Logo - left */}
    <div className="flex-shrink-0">
      <Image
        src="/logo.png"
        alt="PFC Logo"
        width={220}
        height={60}
        className="object-contain"
      />
    </div>

    {/* Nav - center */}
    <nav className="flex space-x-10 text-sm uppercase tracking-wide justify-center">
      <a href="/" className="hover:text-gray-300 transition">Home</a>
      <a href="/blog" className="hover:text-gray-300 transition">Blog</a>
      <a href="/reviews" className="hover:text-gray-300 transition">Reviews</a>
    </nav>

    {/* Social icons - right */}
    <div className="flex items-center space-x-6">
      <a
        href="https://www.facebook.com/groups/pkfragcom"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12.07C22 6.48 17.52 2 12 2S2 6.48 2 12.07C2 17.1 5.66 21.3 10.44 22v-7.02H7.9v-2.91h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.3 22 17.1 22 12.07z" />
        </svg>
      </a>
      <a
        href="https://www.instagram.com/pakfragcom/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5-1.25a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5z"/>
        </svg>
      </a>
    </div>
  </div>
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
