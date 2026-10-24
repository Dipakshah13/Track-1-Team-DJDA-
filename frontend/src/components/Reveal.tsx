/**
 * Reveal — scroll-triggered fade+slide reveal.
 * Uses useInView({ once: true, margin: "-20% 0px" }).
 * Static fallback for reduced-motion users.
 */
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { fadeUpVariants } from '@/lib/motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' })
  const shouldReduceMotion = useReducedMotion()

  const MotionTag = motion[Tag as 'div'] ?? motion.div

  return (
    <MotionTag
      ref={ref}
      className={className}
      variants={shouldReduceMotion ? undefined : fadeUpVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate={shouldReduceMotion || isInView ? 'visible' : 'hidden'}
      style={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
