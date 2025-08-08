'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // Close on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Solidify header after scrolling a bit
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on Escape
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setMobileMenuOpen(false)
  }, [])
  useEffect(() => {
    if (!mobileMenuOpen) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen, onKeyDown])

  const handleLinkClick = () => setMobileMenuOpen(false)

  return (
    <header
      className={[
        'fixed top-0 left-0 w-full z-50 transition-all',
        'backdrop-blur-md border-b',
        isScrolled ? 'bg-black/70 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.35)]' : 'bg-black/40 border-white/5'
      ].join(' ')}
      role="banner"
    >
      {/* Skip to content for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="md:flex md:items-center md:gap-12">
            <Link href="/" className="block focus:outline-none focus:ring-2 focus:ring-white/40 rounded">
              <Image
                src="/logo.png"
                alt="Pakistan Fragrance Community"
                width={220}
                height={50}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block" aria-label="Primary">
            <Navbar onLinkClick={handleLinkClick} />
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Socials (desktop) */}
            <div className="hidden sm:flex items-center gap-3 pr-1">
              <SocialLink
                href="https://www.facebook.com/groups/pkfragcom"
                label="Facebook"
                svg={<FacebookIcon />}
              />
              <SocialLink
                href="https://www.instagram.com/pakfragcom/"
                label="Instagram"
                svg={<InstagramIcon />}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="rounded-sm bg-white/5 p-2 text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-menu"
        className={[
          'md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        ].join(' ')}
      >
        <div
          className="bg-black/90 backdrop-blur-md px-6 py-6 text-white"
          role="dialog"
          aria-modal="true"
        >
          <div className="space-y-4 text-center text-sm uppercase tracking-wide">
            <Link href="/" onClick={handleLinkClick} className="block hover:text-gray-300 focus:text-gray-200">
              Home
            </Link>
            <a
              href="https://forum.pakfrag.com"
              onClick={handleLinkClick}
              className="block hover:text-gray-300 focus:text-gray-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Forum
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex justify-center gap-6">
              <SocialLink
                href="https://www.facebook.com/groups/pkfragcom"
                label="Facebook"
                svg={<FacebookIcon className="w-6 h-6" />}
              />
              <SocialLink
                href="https://www.instagram.com/pakfragcom/"
                label="Instagram"
                svg={<InstagramIcon className="w-6 h-6" />}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-4 py-2 text-xs tracking-wider uppercase bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Close menu"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function SocialLink({ href, label, svg }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
    >
      {svg}
      <span className="sr-only">{label}</span>
    </a>
  )
}

function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0H1.325A1.326 1.326 0 0 0 0 1.325v21.35C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.06h3.129V8.414c0-3.1 1.893-4.788 4.66-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.646h-3.12V24h6.116A1.326 1.326 0 0 0 24 22.675V1.325A1.326 1.326 0 0 0 22.675 0z" />
    </svg>
  )
}

function InstagramIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9A3.7 3.7 0 0 0 16.5 3.8h-9zm4.5 2.9a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6zm0 1.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-1.3a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9z" />
    </svg>
  )
}
