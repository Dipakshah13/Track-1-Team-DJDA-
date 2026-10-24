/**
 * CountUp — animates a number from 0 to target with tabular font.
 * Used in privacy receipts and the extension counter.
 */
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface CountUpProps {
  target: number
  duration?: number // seconds
  className?: string
  prefix?: string
  suffix?: string
}

export function CountUp({ target, duration = 0.7, className = '', prefix = '', suffix = '' }: CountUpProps) {
  const [current, setCurrent] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrent(target)
      return
    }

    const start = performance.now()
    startRef.current = start

    const step = (now: number) => {
      const elapsed = (now - start) / (duration * 1000)
      const progress = Math.min(elapsed, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, shouldReduceMotion])

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  )
}
