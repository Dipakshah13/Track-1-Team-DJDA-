/**
 * FindingRow — a single finding in the findings list.
 * Shows category badge, confidence, and Keep/Redact toggle.
 * Uses layout animation for reordering.
 * NEVER shows raw text outside local Original panel.
 */
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { findingItemVariants } from '@/lib/motion'
import { CATEGORY_LABELS, confidenceTier } from '@/lib/api'
import type { FindingWithDecision, FindingCategory } from '@/lib/api'

interface FindingRowProps {
  finding: FindingWithDecision
  /** If true, also shows the raw text (local Original panel only) */
  showRawText?: boolean
  onToggle: (id: string, decision: 'keep' | 'redact') => void
}

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH:   'text-signal',
  MEDIUM: 'text-caution',
  LOW:    'text-muted',
}

export function FindingRow({ finding, showRawText = false, onToggle }: FindingRowProps) {
  const shouldReduceMotion = useReducedMotion()
  const tier = confidenceTier(finding.confidence)
  const isRedacted = finding.decision === 'redact'

  return (
    <motion.div
      layout
      key={finding.id}
      variants={shouldReduceMotion ? undefined : findingItemVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      exit="exit"
      className={`
        flex items-start gap-3 p-3 rounded-sm border transition-colors
        ${isRedacted
          ? 'bg-paper-2 border-line'
          : 'bg-surface border-line opacity-70'
        }
      `}
    >
      {/* Category badge */}
      <span className="category-badge mt-0.5 flex-shrink-0">
        {finding.category}
      </span>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        <div className="font-sans text-sm font-medium text-ink">
          {CATEGORY_LABELS[finding.category as FindingCategory]}
        </div>
        {/* Raw text only shown in local Original panel */}
        {showRawText && finding.text && (
          <div className="font-mono text-xs text-muted mt-0.5 truncate">
            {finding.text}
          </div>
        )}
        <div className={`font-mono text-xs mt-0.5 ${CONFIDENCE_COLORS[tier]}`}>
          {tier} confidence · {Math.round(finding.confidence * 100)}%
        </div>
      </div>

      {/* Toggle */}
      <div className="flex-shrink-0">
        <Toggle
          checked={isRedacted}
          onLabel="Redact"
          offLabel="Keep"
          onChange={(checked) => onToggle(finding.id, checked ? 'redact' : 'keep')}
          aria-label={`${isRedacted ? 'Redacting' : 'Keeping'} ${CATEGORY_LABELS[finding.category as FindingCategory]}`}
        />
      </div>
    </motion.div>
  )
}

/**
 * Toggle — small two-state button for Keep/Redact
 */
interface ToggleProps {
  checked: boolean
  onLabel: string
  offLabel: string
  onChange: (checked: boolean) => void
  'aria-label'?: string
}

function Toggle({ checked, onLabel, offLabel, onChange, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={`
        font-mono text-xs font-semibold tracking-wide
        px-2 py-1 rounded-sm border transition-colors
        ${checked
          ? 'bg-ink text-paper border-ink'
          : 'bg-surface text-muted border-line hover:border-muted'
        }
      `}
    >
      {checked ? onLabel : offLabel}
    </button>
  )
}
