/**
 * RedactionBar — the signature motif of Aegis.
 * Draws left-to-right via clip-path/scaleX, label fades in after.
 * Used in hero loop, findings, before/after panels, extension diff view.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { redactionBarVariants } from '@/lib/motion'
import type { FindingCategory } from '@/lib/api'

interface RedactionBarProps {
  label: FindingCategory | string
  /** Delay in seconds before this bar animates */
  delay?: number
  /** Use signal (red) background instead of ink */
  variant?: 'ink' | 'signal'
  className?: string
  /** Static mode — no animation, just render */
  static?: boolean
}

export function RedactionBar({
  label,
  delay = 0,
  variant = 'ink',
  className = '',
  static: isStatic = false,
}: RedactionBarProps) {
  const shouldReduceMotion = useReducedMotion()
  const skipAnimation = isStatic || shouldReduceMotion

  return (
    <span
      className={`redaction-bar ${variant === 'signal' ? 'redaction-bar--signal' : ''} ${className}`}
      style={{ display: 'inline-flex', minWidth: '4em' }}
    >
      <motion.span
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          transformOrigin: 'left center',
        }}
        variants={skipAnimation ? undefined : redactionBarVariants}
        initial={skipAnimation ? false : 'hidden'}
        animate="visible"
        custom={skipAnimation ? 0 : delay}
      />
      <motion.span
        initial={skipAnimation ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={skipAnimation ? { duration: 0 } : { delay: delay + 0.3, duration: 0.2 }}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 0.35em' }}
      >
        {label}
      </motion.span>
    </span>
  )
}

/**
 * InlineRedaction — wraps a span of text and replaces it with a RedactionBar.
 * Animates the replacement on mount.
 */
interface InlineRedactionProps {
  label: FindingCategory | string
  delay?: number
  variant?: 'ink' | 'signal'
}

export function InlineRedaction({ label, delay = 0, variant = 'ink' }: InlineRedactionProps) {
  return (
    <RedactionBar
      label={label}
      delay={delay}
      variant={variant}
      className="mx-0.5 align-middle"
    />
  )
}
