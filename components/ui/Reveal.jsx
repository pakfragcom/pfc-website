import { m, useInView } from 'framer-motion'
import { useRef } from 'react'

const EASE = [0.25, 0.46, 0.45, 0.94]

/**
 * Scroll-triggered reveal. Fades + lifts in once the element enters the viewport.
 * Wraps children in an m.div — use `className` to pass layout styles.
 *
 * Props:
 *   delay    – seconds before animation starts (for staggering siblings)
 *   duration – animation duration in seconds (default 0.55)
 *   y        – starting Y offset in px (default 22)
 *   amount   – fraction of element visible before triggering (default 0.1)
 */
export default function Reveal({
  children,
  delay = 0,
  duration = 0.55,
  y = 22,
  amount = 0.1,
  className = '',
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount })

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration, ease: EASE, delay }}
      className={className}
    >
      {children}
    </m.div>
  )
}
