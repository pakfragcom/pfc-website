import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Logo */}
          <div className="md:flex md:items-center md:gap-12">
            <a href="/" className="block">
              <Image
                src="/logo.png"
                alt="PFC Logo"
                width={220}
                height={50}
                className="object-contain"
                priority
              />
            </a>
          </div>

          {/* Center: Navigation */}
          <div className="hidden md:block">
            <nav aria-label="Main Navigation">
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

          {/* Right: Social icons & mobile menu */}
          <div className="flex items-center gap-4">
            {/* Social icons (show on sm and up) */}
            <div className="hidden sm:flex items-center space-x-4">
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
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5-1.25a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5z" />
                </svg>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="block md:hidden">
              <button
                className="rounded-sm bg-black/20 p-2 text-gray-400 transition hover:text-white"
                aria-label="Open Menu"
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

