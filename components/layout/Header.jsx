import { useEffect, useState, useCallback, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser, useSupabaseClient } from '../../lib/auth-context'
import Navbar from './Navbar'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const [isScrolled, setIsScrolled]           = useState(false)
  const [desktopToolsOpen, setDesktopToolsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen]        = useState(false)
  const router    = useRouter()
  const pathname  = router.pathname
  const user      = useUser()
  const supabase  = useSupabaseClient()

  const toolsDesktopBtnId  = useId()
  const toolsDesktopMenuId = useId()
  const toolsMobileBtnId   = useId()
  const toolsMobileMenuId  = useId()

  const toolsRef      = useRef(null)
  const userMenuRef   = useRef(null)
  const mobileDrawerRef = useRef(null)
  const lastFocusRef  = useRef(null)

  const TOOL_LINKS = [
    { href: '/tools/verify-seller', label: 'Verify Seller Check' },
    { href: '/tools/decant',        label: 'Decant Calculator' },
    { href: '/tools/bottle-level',  label: 'Bottle Level Estimator' },
    { href: '/tools/indie-lab',     label: 'Indie Lab Helper' },
  ]

  /* Body scroll lock */
  useEffect(() => {
    const { style } = document.body
    const prev = style.overflow
    if (mobileMenuOpen) style.overflow = 'hidden'
    else style.overflow = prev || ''
    return () => { style.overflow = prev || '' }
  }, [mobileMenuOpen])

  /* Close on route change */
  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileToolsOpen(false)
    setDesktopToolsOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  /* Solidify on scroll */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Escape closes everything */
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false); setMobileToolsOpen(false)
      setDesktopToolsOpen(false); setUserMenuOpen(false)
      lastFocusRef.current?.focus?.()
    }
  }, [])
  useEffect(() => {
    if (!(mobileMenuOpen || desktopToolsOpen || userMenuOpen)) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen, desktopToolsOpen, userMenuOpen, onKeyDown])

  /* Click outside — tools */
  useEffect(() => {
    function handle(e) {
      if (!desktopToolsOpen) return
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setDesktopToolsOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [desktopToolsOpen])

  /* Click outside — user menu */
  useEffect(() => {
    function handle(e) {
      if (!userMenuOpen) return
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [userMenuOpen])

  /* Mobile focus trap */
  useEffect(() => {
    if (!mobileMenuOpen) return
    const root = mobileDrawerRef.current
    if (!root) return
    const focusable = root.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    function trap(e) {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    root.addEventListener('keydown', trap); first?.focus()
    return () => root.removeEventListener('keydown', trap)
  }, [mobileMenuOpen])

  const handleLinkClick = () => {
    setMobileMenuOpen(false); setMobileToolsOpen(false)
    setDesktopToolsOpen(false); setUserMenuOpen(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  /* Avatar initials */
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header
      className={[
        'fixed top-0 left-0 w-full z-50 transition-all',
        'backdrop-blur-md border-b',
        'motion-safe:duration-300 motion-safe:ease-out',
        isScrolled ? 'bg-black/70 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]' : 'bg-black/40 border-white/5'
      ].join(' ')}
      role="banner"
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>

      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" aria-label="Pakistan Fragrance Community — Home"
            className="block flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/40 rounded">
            <Image src="/logo.png" alt="Pakistan Fragrance Community logo"
              width={200} height={46} sizes="(max-width: 768px) 150px, 200px"
              className="object-contain" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 flex-1 justify-center" aria-label="Primary">
            <Navbar onLinkClick={handleLinkClick} />

            {/* Tools dropdown */}
            <div className="relative" ref={toolsRef}>
              <button id={toolsDesktopBtnId} type="button"
                onClick={e => { setDesktopToolsOpen(v => !v); lastFocusRef.current = e.currentTarget }}
                onMouseEnter={() => setDesktopToolsOpen(true)}
                onFocus={() => setDesktopToolsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                aria-haspopup="menu" aria-expanded={desktopToolsOpen} aria-controls={toolsDesktopMenuId}>
                Tools
                <ChevronDown className={`h-4 w-4 transition-transform motion-safe:duration-200 ${desktopToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              <div id={toolsDesktopMenuId} role="menu" aria-labelledby={toolsDesktopBtnId}
                onMouseLeave={() => setDesktopToolsOpen(false)}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDesktopToolsOpen(false) }}
                className={[
                  'absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-xl',
                  'transition-all motion-safe:duration-150 ease-out origin-top-right',
                  desktopToolsOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                ].join(' ')}>
                <ul className="py-2">
                  {TOOL_LINKS.map(item => (
                    <li key={item.href} role="none">
                      <Link href={item.href} onClick={handleLinkClick} role="menuitem"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 focus:bg-white/15 focus:outline-none">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Socials (desktop only) */}
            <div className="hidden lg:flex items-center gap-1 mr-1">
              <SocialLink href="https://www.facebook.com/groups/pkfragcom" label="Facebook" title="Join our Facebook Group">
                <FacebookIcon className="w-5 h-5" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com/pakfragcom/" label="Instagram" title="Follow us on Instagram">
                <InstagramIcon className="w-5 h-5" />
              </SocialLink>
            </div>

            {/* Auth — desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                /* Logged in — avatar + dropdown */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-[#2a5c4f] to-[#94aea7] text-xs font-bold text-white ring-2 ring-white/10 hover:ring-white/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    aria-label="Account menu" aria-haspopup="true" aria-expanded={userMenuOpen}
                  >
                    {initials}
                  </button>

                  <div className={[
                    'absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-xl py-1',
                    'transition-all motion-safe:duration-150 ease-out origin-top-right',
                    userMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                  ].join(' ')}>
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-xs font-medium text-white truncate">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href={`/u/${user.user_metadata?.username || 'me'}`} onClick={handleLinkClick}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition">
                      My Profile
                    </Link>
                    <Link href="/reviews/submit" onClick={handleLinkClick}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition">
                      Write a Review
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition border-t border-white/10 mt-1">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Logged out — Sign In + Get Started */
                <>
                  <Link href="/auth/login"
                    className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg">
                    Sign In
                  </Link>
                  <Link href="/auth/signup"
                    className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2a5c4f] to-[#557d72] text-sm font-semibold text-white shadow-md shadow-[#2a5c4f]/20 hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button onClick={e => { setMobileMenuOpen(v => !v); lastFocusRef.current = e.currentTarget }}
                className="rounded-sm bg-white/5 p-2 text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                aria-label="Toggle menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-menu">
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div id="mobile-menu" ref={mobileDrawerRef}
        className={['md:hidden overflow-hidden transition-[max-height,opacity] motion-safe:duration-300 ease-out',
          mobileMenuOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'].join(' ')}
        role="dialog" aria-modal="true">
        <div className="bg-black/90 backdrop-blur-md px-6 py-6 text-white">

          {/* Auth section at top */}
          <div className="mb-6 pb-5 border-b border-white/10">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#2a5c4f] to-[#94aea7] text-xs font-bold text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.user_metadata?.full_name || 'Account'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/auth/signup" onClick={handleLinkClick}
                  className="w-full text-center rounded-xl bg-gradient-to-r from-[#2a5c4f] to-[#557d72] py-2.5 text-sm font-semibold text-white">
                  Get Started
                </Link>
                <Link href="/auth/login" onClick={handleLinkClick}
                  className="w-full text-center rounded-xl border border-white/15 py-2.5 text-sm text-gray-300 hover:text-white transition">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4 text-center text-sm uppercase tracking-wide">
            <Link href="/" onClick={handleLinkClick} className="block hover:text-gray-300 transition">Home</Link>
            <Link href="/local-houses" onClick={handleLinkClick} className="block hover:text-gray-300 transition">Local Houses</Link>
            <Link href="/fragrances" onClick={handleLinkClick} className="block hover:text-gray-300 transition">Fragrances</Link>
            <Link href="/reviews" onClick={handleLinkClick} className="block hover:text-gray-300 transition">Reviews</Link>

            {/* Tools */}
            <div className="pt-2">
              <button id={toolsMobileBtnId} onClick={() => setMobileToolsOpen(v => !v)}
                className="mx-auto flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs tracking-wider uppercase bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                aria-expanded={mobileToolsOpen} aria-controls={toolsMobileMenuId}>
                Tools <ChevronDown className={`h-4 w-4 transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              <div id={toolsMobileMenuId}
                className={['mx-auto mt-2 w-full max-w-xs overflow-hidden rounded-lg border border-white/10 bg-black/70',
                  'transition-[max-height,opacity] motion-safe:duration-300 ease-out',
                  mobileToolsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'].join(' ')}
                role="menu">
                <ul className="p-2 text-left text-xs normal-case">
                  {TOOL_LINKS.map(item => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={handleLinkClick}
                        className="block rounded-md px-3 py-2 hover:bg-white/10">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Social + sign out */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
            <div className="flex justify-center gap-6">
              <SocialLink href="https://www.facebook.com/groups/pkfragcom" label="Facebook">
                <FacebookIcon className="w-6 h-6" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com/pakfragcom/" label="Instagram">
                <InstagramIcon className="w-6 h-6" />
              </SocialLink>
            </div>
            {user && (
              <button onClick={handleSignOut}
                className="text-xs text-red-400 hover:text-red-300 transition">
                Sign Out
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-4 py-2 text-xs tracking-wider uppercase bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30">
              Close
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ── Icons & helpers ── */
function ChevronDown({ className = 'h-4 w-4' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0l-4.24-3.36a.75.75 0 01-.02-1.06z" clipRule="evenodd" /></svg>
}

function MenuIcon({ className = 'h-5 w-5' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
}

function SocialLink({ href, label, title, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in new tab)`} title={title || label}
      className="text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md p-1.5 transition">
      {children}<span className="sr-only">{label}</span>
    </a>
  )
}

function FacebookIcon({ className = 'w-5 h-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.675 0H1.325A1.326 1.326 0 000 1.325v21.35C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.06h3.129V8.414c0-3.1 1.893-4.788 4.66-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.646h-3.12V24h6.116A1.326 1.326 0 0024 22.675V1.325A1.326 1.326 0 0022.675 0z"/></svg>
}

function InstagramIcon({ className = 'w-5 h-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 2h9A5.5 5.5 0 0122 7.5v9A5.5 5.5 0 0116.5 22h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 1.8A3.7 3.7 0 003.8 7.5v9a3.7 3.7 0 003.7 3.7h9a3.7 3.7 0 003.7-3.7v-9A3.7 3.7 0 0016.5 3.8h-9zm4.5 2.9a5.8 5.8 0 100 11.6 5.8 5.8 0 000-11.6zm0 1.8a4 4 0 110 8 4 4 0 010-8zm5-1.3a.95.95 0 100 1.9.95.95 0 000-1.9z"/></svg>
}
