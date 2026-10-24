/**
 * VerdictBanner — full-width verdict display for Guard screen.
 * Includes stamp animation, confidence bar, and aria-live for assistive tech.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, ShieldX, LucideIcon } from 'lucide-react'
import { Stamp } from './Stamp'
import { fadeUpVariants } from '@/lib/motion'
import type { GuardVerdict } from '@/lib/api'

interface VerdictBannerProps {
  verdict: GuardVerdict
  confidence: number
  findingCount: number
  durationMs: number
  className?: string
}

const VERDICT_CONFIG: Record<GuardVerdict, {
  bg: string
  icon: LucideIcon
  headline: string
  subtext: string
}> = {
  safe: {
    bg: 'border-safe/40 bg-safe/5',
    icon: ShieldCheck,
    headline: 'No injection detected',
    subtext: 'This document appears safe for agent processing.',
  },
  suspicious: {
    bg: 'border-caution/40 bg-caution/5',
    icon: ShieldAlert,
    headline: 'Suspicious patterns found',
    subtext: 'Review flagged sections before processing with an agent.',
  },
  malicious: {
    bg: 'border-signal/40 bg-signal/5',
    icon: ShieldX,
    headline: 'Injection attempt detected',
    subtext: 'This document contains instructions trying to override agent behaviour.',
  },
}

export function VerdictBanner({ verdict, confidence, findingCount, durationMs, className = '' }: VerdictBannerProps) {
  const shouldReduceMotion = useReducedMotion()
  const config = VERDICT_CONFIG[verdict]
  const Icon = config.icon

  return (
    <motion.div
      className={`border rounded-sm p-5 ${config.bg} ${className}`}
      variants={shouldReduceMotion ? undefined : fadeUpVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      role="status"
      aria-live="assertive"
      aria-label={`Guard verdict: ${verdict}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <Icon
          size={20}
          className={
            verdict === 'safe' ? 'text-safe mt-0.5' :
            verdict === 'suspicious' ? 'text-caution mt-0.5' :
            'text-signal mt-0.5'
          }
          aria-hidden="true"
        />

        {/* Text */}
        <div className="flex-1">
          <div className="font-sans font-semibold text-base mb-1">{config.headline}</div>
          <div className="font-sans text-sm text-muted">{config.subtext}</div>
          <div className="font-mono text-xs text-muted mt-2 flex items-center gap-4">
            <span>{findingCount} finding{findingCount !== 1 ? 's' : ''}</span>
            <span>{Math.round(confidence * 100)}% confidence</span>
            <span>{durationMs}ms</span>
          </div>
        </div>

        {/* Stamp */}
        <Stamp verdict={verdict} />
      </div>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="h-1 bg-line rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              verdict === 'safe' ? 'bg-safe' :
              verdict === 'suspicious' ? 'bg-caution' :
              'bg-signal'
            }`}
            initial={shouldReduceMotion ? false : { width: 0 }}
            animate={{ width: `${Math.round(confidence * 100)}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  )
}
