import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-black/80 text-gray-400 border-t border-gray-700 mt-20">
      <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-12">
        
        {/* Top: Logo + Description */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Logo and About */}
          <div className="max-w-md">
            <Image src="/logo.png" alt="PFC Logo" width={180} height={50} className="mb-4" />
            <p className="text-sm leading-relaxed text-gray-400">
              Pakistan Fragrance Community is the nation’s first and most trusted platform for fragrance lovers, collectors, and reviewers — enabling buying, selling, decanting and sharing scents.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm uppercase tracking-wide text-gray-400">
            <div>
              <h4 className="mb-4 font-semibold text-white">Explore</h4>
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-white">Home</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/reviews" className="hover:text-white">Reviews</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Community</h4>
              <ul className="space-y-2">
                <li><a href="https://www.facebook.com/groups/pkfragcom" target="_blank" className="hover:text-white">Facebook Group</a></li>
                <li><a href="https://www.instagram.com/pakfragcom/" target="_blank" className="hover:text-white">Instagram</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom: Socials + Copyright */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Pakistan Fragrance Community. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-5">
            <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" aria-label="Facebook">
              <svg className="w-5 h-5 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12.07C22 6.48 17.52 2..." />
              </svg>
            </a>
            <a href="https://www.instagram.com/pakfragcom/" target="_blank" aria-label="Instagram">
              <svg className="w-5 h-5 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.75 2h8.5A5.75..." />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
