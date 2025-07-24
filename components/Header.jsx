import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-[80px] bg-black/50 backdrop-blur-md border-b border-gray-800 flex items-center px-10">
      <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto">
        <div className="flex-shrink-0">
          <Image src="/logo.png" alt="PFC Logo" width={220} height={60} className="object-contain" />
        </div>
        <nav className="flex space-x-10 text-sm uppercase tracking-wide justify-center">
          <a href="/" className="hover:text-gray-300 transition">Home</a>
          <a href="/blog" className="hover:text-gray-300 transition">Blog</a>
          <a href="/reviews" className="hover:text-gray-300 transition">Reviews</a>
        </nav>
        <div className="flex items-center space-x-6">
          <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12.07C22 6.48...Z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/pakfragcom/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg className="w-5 h-5 text-gray-400 hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.75 2h8.5A5.75..." />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
