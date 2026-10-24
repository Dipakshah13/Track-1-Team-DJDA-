/**
 * PrivacyReceipt — perforated-edge receipt card showing what Aegis did.
 * NEVER shows raw Finding.text values — only category counts.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle, Clock, Hash, ArrowRight } from 'lucide-react'
import { CountUp } from './CountUp'
import { Reveal } from './Reveal'
import { revealVariants } from '@/lib/motion'
import type { PrivacyReceiptData, FindingCategory } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/api'

interface PrivacyReceiptProps {
  data: PrivacyReceiptData
  className?: string
}

export function PrivacyReceipt({ data, className = '' }: PrivacyReceiptProps) {
  const shouldReduceMotion = useReducedMotion()
  const entries = Object.entries(data.category_counts) as [FindingCategory, number][]

  return (
    <Reveal className={className}>
      <div
        className="bg-surface border border-line rounded-sm overflow-hidden max-w-sm"
        style={{ boxShadow: 'var(--tw-shadow, 0 1px 0 0 rgba(14,14,16,0.08), 0 2px 8px -2px rgba(14,14,16,0.12))' }}
        role="region"
        aria-label="Privacy Receipt"
      >
        {/* Top perforated edge */}
        <div className="receipt-tear" />

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-line">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs tracking-widest uppercase text-muted">Privacy Receipt</span>
            <CheckCircle size={14} className="text-safe" aria-hidden="true" />
          </div>
          <div className="font-mono text-xs text-muted">{data.timestamp}</div>
        </div>

        {/* Category breakdown */}
        <div className="px-5 py-4 space-y-2 border-b border-line">
          {entries.length === 0 ? (
            <p className="font-mono text-xs text-muted">No sensitive items detected.</p>
          ) : (
            entries.map(([category, count], i) => (
              <motion.div
                key={category}
                className="flex items-center justify-between"
                variants={shouldReduceMotion ? undefined : revealVariants}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                custom={i}
              >
                <span className="font-mono text-xs text-muted">{CATEGORY_LABELS[category]}</span>
                <span className="flex items-center gap-2">
                  <span className="category-badge">{category}</span>
                  <CountUp target={count} duration={0.5} className="text-xs font-bold text-ink" />
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary stats */}
        <div className="px-5 py-4 space-y-2 border-b border-line">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">Total redacted</span>
            <CountUp
              target={data.total_items_redacted}
              duration={0.7}
              className="text-sm font-bold text-ink"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">Route</span>
            <span className="font-mono text-xs font-semibold flex items-center gap-1">
              {data.route === 'local' ? (
                <span className="text-safe">Local only</span>
              ) : (
                <>
                  <span className="text-caution">Cloud</span>
                  <ArrowRight size={10} className="text-muted" />
                  <span className="text-muted">redacted text only</span>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted flex items-center gap-1">
              <Clock size={10} />
              Duration
            </span>
            <span className="font-mono text-xs">{data.duration_ms}ms</span>
          </div>
        </div>

        {/* The invariant */}
        <div className="px-5 py-3 bg-ink text-paper">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs opacity-70">Raw values sent to cloud</span>
            <CountUp
              target={0}
              className="text-sm font-bold text-safe"
              suffix=""
            />
          </div>
        </div>

        {/* Ledger hash */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2">
            <Hash size={10} className="text-muted flex-shrink-0" />
            <span className="hash-text truncate">{data.ledger_hash}</span>
          </div>
        </div>

        {/* Bottom perforated edge */}
        <div className="receipt-tear--bottom" />
      </div>
    </Reveal>
  )
}
