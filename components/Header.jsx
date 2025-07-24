import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo (left) */}
          <div className="md:flex md:items-center md:gap-12">
            <a href="/" className="block">
              <Image
                src="/logo.png"
                alt="PFC Logo"
                width={180}
                height={50}
                className="object-contain"
                priority
              />
            </a>
          </div>

          {/* Center Nav (Desktop only) */}
          <div className="hidden md:block">
            <nav aria-label="Global">
              <ul className="flex items-center gap-6 text-sm uppercase tracking-wide">
                <li>
                  <a href="/" className="text-gray-300 hover:text-white transition">Home</a>
                </li>
                <li>
                  <a href="/blog" className="text-gray-300 hover:text-white transition">Blog</a>
                </li>
                <li>
                  <a href="/reviews" className="text-gray-300 hover:text-white transition">Reviews</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Right: Social icons + Mobile menu */}
          <div className="flex items-center gap-4">
            {/* Social Icons */}
            <div className="hidden sm:flex items-center space-x-5">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12.07C22 6.48 17.52 2 12 2S2 6.48 2 12.07C2 17.1..." />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/pakfragcom/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2h8.5A5.75..." />
                </svg>
              </a>
            </div>

            {/* Mobile menu toggle */}
            <div className="block md:hidden">
              <button
                className="p-2 rounded-sm text-gray-400 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
