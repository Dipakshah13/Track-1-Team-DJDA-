/**
 * LiveTrace.tsx — Real-time execution stepper
 * Consumes SSE / local runner to visualize the 4-phase Aegis security pipeline:
 * [1] Scanning Inbound ➔ [2] Redacting PII ➔ [3] Routing ➔ [4] Hashing to Ledger
 */
import { motion } from 'framer-motion'
import { Terminal, CheckCircle2, AlertCircle, Loader2, Clock, Lock } from 'lucide-react'
import type { TraceStep } from '@/lib/types'

interface LiveTraceProps {
  steps: TraceStep[]
  isDone: boolean
  className?: string
}

export function LiveTrace({ steps, isDone, className = '' }: LiveTraceProps) {
  return (
    <div className={`border border-paper/10 bg-ink-2 rounded-sm overflow-hidden ${className}`}>
      {/* Title Bar */}
      <div className="px-4 py-2.5 border-b border-paper/10 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-safe" />
          <span className="font-semibold text-paper uppercase tracking-wider">
            Live Execution Trace (SSE)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDone ? (
            <span className="text-safe flex items-center gap-1 text-[11px]">
              <CheckCircle2 size={12} /> Pipeline Complete
            </span>
          ) : (
            <span className="text-paper/50 flex items-center gap-1 text-[11px]">
              <Loader2 size={12} className="animate-spin text-signal" /> Processing
            </span>
          )}
        </div>
      </div>

      {/* Monospace Steps List */}
      <div className="p-4 space-y-3 font-mono text-xs">
        {steps.map((s) => {
          const isActive = s.status === 'active'
          const isCompleted = s.status === 'completed'
          const isAlert = s.status === 'alert'

          return (
            <div
              key={s.step}
              className={`flex items-start gap-3 p-2.5 rounded-sm transition-all border ${
                isActive
                  ? 'border-signal/50 bg-signal/5'
                  : isCompleted
                  ? 'border-paper/5 bg-ink/60'
                  : isAlert
                  ? 'border-signal bg-signal/10'
                  : 'border-transparent opacity-40'
              }`}
            >
              {/* Step indicator badge */}
              <div
                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                  isActive
                    ? 'bg-signal text-paper animate-pulse'
                    : isCompleted
                    ? 'bg-safe/20 text-safe border border-safe/40'
                    : isAlert
                    ? 'bg-signal text-paper'
                    : 'bg-paper/10 text-paper/40'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={13} /> : s.step}
              </div>

              {/* Step description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-paper">
                    [{s.step}] {s.title}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      isActive
                        ? 'text-signal font-bold'
                        : isCompleted
                        ? 'text-safe font-semibold'
                        : isAlert
                        ? 'text-signal font-bold'
                        : 'text-paper/30'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-paper/60 text-[11px] mt-0.5">{s.label}</div>

                {s.detail && (
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-[10px] text-paper/80 bg-ink px-2 py-1 rounded border border-paper/10 flex items-center gap-1.5"
                  >
                    <span className="text-safe">↳</span>
                    <span>{s.detail}</span>
                  </motion.div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 border-t border-paper/10 bg-ink/70 flex items-center justify-between font-mono text-[10px] text-paper/40">
        <span className="flex items-center gap-1">
          <Lock size={10} className="text-safe" /> Daemon: localhost:8000
        </span>
        <span>Local Merkle Protocol v1.4</span>
      </div>
    </div>
  )
}
