'use client'
import Link from 'next/link'

export default function Navbar({ onLinkClick }) {
  return (
    <nav aria-label="Main Navigation">
      <ul className="flex items-center gap-6 text-sm uppercase tracking-wide">
        <li>
          <Link
            href="/"
            onClick={onLinkClick}
            className="text-gray-300 hover:text-white transition"
          >
            Home
          </Link>
        </li>
        <li>
          <a
            href="https://forum.pakfrag.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onLinkClick}
            className="text-gray-300 hover:text-white transition"
          >
            Forum
          </a>
        </li>
      </ul>
    </nav>
  )
}

