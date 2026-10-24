/**
 * Stamp — verdict stamp (SAFE / MALICIOUS / SUSPICIOUS)
 * Springs in at scale 1.4 → 1, slight rotate.
 * MALICIOUS variant applies a screen-shake after landing.
 */
import { motion, useReducedMotion, useAnimate } from 'framer-motion'
import { useEffect } from 'react'
import { stampVariants, spring, maliciousShakeKeyframes } from '@/lib/motion'
import type { GuardVerdict } from '@/lib/api'

interface StampProps {
  verdict: GuardVerdict
  className?: string
  onAnimationComplete?: () => void
}

const STAMP_CONFIG: Record<GuardVerdict, { label: string; className: string; rotate: number }> = {
  safe:       { label: 'SAFE',       className: 'stamp--safe',       rotate: -3 },
  suspicious: { label: 'SUSPICIOUS', className: 'stamp--suspicious', rotate: -2 },
  malicious:  { label: 'MALICIOUS',  className: 'stamp--malicious',  rotate: 2 },
}

export function Stamp({ verdict, className = '', onAnimationComplete }: StampProps) {
  const shouldReduceMotion = useReducedMotion()
  const [scope, animate] = useAnimate()
  const config = STAMP_CONFIG[verdict]

  useEffect(() => {
    if (verdict === 'malicious' && !shouldReduceMotion) {
      // Trigger screen shake after stamp lands
      const timer = setTimeout(() => {
        animate(scope.current, maliciousShakeKeyframes, {})
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [verdict, shouldReduceMotion, animate, scope])

  return (
    <motion.span
      ref={scope}
      className={`stamp ${config.className} ${className}`}
      style={{ rotate: config.rotate }}
      variants={shouldReduceMotion ? undefined : stampVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      transition={spring.default}
      onAnimationComplete={onAnimationComplete}
      aria-label={`Verdict: ${config.label}`}
    >
      {config.label}
    </motion.span>
  )
}
