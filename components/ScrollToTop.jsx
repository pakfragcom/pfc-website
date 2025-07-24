"use client"
import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }
    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    visible && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-black/70 p-3 text-white shadow-md backdrop-blur hover:bg-black transition"
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    )
  )
}
