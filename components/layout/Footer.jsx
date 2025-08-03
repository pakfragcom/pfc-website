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
            <div className="mt-6">
              <a
                href="https://www.facebook.com/groups/pkfragcom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition"
              >
                Join Our Community
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm uppercase tracking-wide text-gray-400">
            <div>
              <h4 className="mb-4 font-semibold text-[#F5F5F7]">Explore</h4>
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-white">Home</a></li>
                <li><a href="https://forum.pakfrag.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Forum</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-[#F5F5F7]">Community</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Facebook Group
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/pakfragcom/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-[#F5F5F7]">Legal</h4>
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
            <a href="https://www.facebook.com/groups/pkfragcom" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg className="w-5 h-5 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12.07C22 6.48 17.52 2 12 2S2 6.48 2 12.07c0 4.9 3.66 8.96 8.44 9.83v-6.95h-2.54v-2.88h2.54V9.79c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.88h-2.34v6.95C18.34 21.03 22 16.97 22 12.07z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/pakfragcom/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg className="w-5 h-5 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.4 1 .4.4.7.8 1 1.4.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.4-.4.4-.8.7-1.4 1-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.4-1-.4-.4-.7-.8-1-1.4-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.4.4-.4.8-.7 1.4-1 .5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.4 0-4.6.1-1.1.1-1.6.2-2 .4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.1.4-.3.9-.4 2-.1 1.2-.1 1.5-.1 4.6s0 3.4.1 4.6c.1 1.1.2 1.6.4 2 .2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.1.9.3 2 .4 1.2.1 1.5.1 4.6.1s3.4 0 4.6-.1c1.1-.1 1.6-.2 2-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.1-.4.3-.9.4-2 .1-1.2.1-1.5.1-4.6s0-3.4-.1-4.6c-.1-1.1-.2-1.6-.4-2-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.1-.9-.3-2-.4-1.2-.1-1.5-.1-4.6-.1zm0 3.9a5.9 5.9 0 110 11.8 5.9 5.9 0 010-11.8zm0 9.8a3.9 3.9 0 100-7.8 3.9 3.9 0 000 7.8zm5.8-10.6a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
