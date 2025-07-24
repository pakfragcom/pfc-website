'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) setIsVisible(true)
      else setIsVisible(false)
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return isVisible ? (
    <button
      onClick={scrollToTop}
      className="fixed bottom-5 right-5 z-50 rounded-full bg-black/70 p-3 text-white backdrop-blur-sm hover:bg-black"
    >
      <ArrowUp size={20} />
    </button>
  ) : null
}
