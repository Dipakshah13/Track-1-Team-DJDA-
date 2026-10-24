/**
 * FindingsTable.tsx — Entities inspection table
 * Lists detected PII entities with toggleable mask/reveal and Keep/Redact controls.
 */
import { useState } from 'react'
import { Eye, EyeOff, Shield, Check, X, ShieldAlert, Tag } from 'lucide-react'
import type { Finding, FindingCategory } from '@/lib/types'

interface FindingsTableProps {
  findings: Finding[]
  onToggleDecision: (id: string, decision: 'keep' | 'redact') => void
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  NAME: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  AADHAAR: { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400' },
  CARD: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
  EMAIL: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  PHONE: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400' },
  SSN: { bg: 'bg-signal/10 border-signal/30', text: 'text-signal' },
  IBAN: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  MEDICAL: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
  API_KEY: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
}

export function FindingsTable({ findings, onToggleDecision }: FindingsTableProps) {
  // Set of entity IDs whose raw text is unmasked locally
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (findings.length === 0) {
    return (
      <div className="border border-paper/10 bg-ink-2/60 rounded-sm p-8 text-center font-mono text-xs text-paper/40">
        <Shield size={24} className="mx-auto mb-2 text-safe/60" />
        <div>No sensitive entities found in this payload. Clean payload ready for routing.</div>
      </div>
    )
  }

  return (
    <div className="border border-paper/10 bg-ink-2 rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-paper/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={13} className="text-signal" />
          <span className="font-mono text-xs font-semibold text-paper uppercase tracking-wider">
            Detected Entities ({findings.length})
          </span>
        </div>
        <span className="font-mono text-[10px] text-paper/40">
          Click eye to inspect local original
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-paper/10 bg-ink/40 text-[10px] text-paper/50 uppercase tracking-wider">
              <th className="py-2.5 px-4">Entity Category</th>
              <th className="py-2.5 px-4">Sanitized Placeholder</th>
              <th className="py-2.5 px-4">Raw Value (Local)</th>
              <th className="py-2.5 px-4">Confidence</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper/5 text-paper/80">
            {findings.map((f) => {
              const isRevealed = revealedIds.has(f.id)
              const isRedacted = f.decision === 'redact'
              const catStyle = CATEGORY_STYLES[f.category] || {
                bg: 'bg-paper/10 border-paper/20',
                text: 'text-paper',
              }

              return (
                <tr key={f.id} className="hover:bg-paper/[0.02] transition-colors">
                  {/* Category Tag */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text}`}
                    >
                      {f.category}
                    </span>
                  </td>

                  {/* Sanitized Placeholder */}
                  <td className="py-3 px-4">
                    <span className="bg-ink border border-paper/20 text-paper px-2 py-0.5 rounded text-[11px]">
                      {f.placeholder}
                    </span>
                  </td>

                  {/* Raw Text with Reveal/Mask Button */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]">
                        {isRevealed ? (
                          <span className="text-signal font-semibold bg-signal/10 px-1 rounded">
                            {f.original_text || f.text}
                          </span>
                        ) : (
                          <span className="text-paper/30 tracking-widest">••••••••••</span>
                        )}
                      </span>
                      <button
                        onClick={() => toggleReveal(f.id)}
                        className="text-paper/40 hover:text-paper transition-colors p-1"
                        title={isRevealed ? 'Mask secret' : 'Reveal secret (local)'}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-ink border border-paper/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-safe"
                          style={{ width: `${Math.round(f.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-paper/50">
                        {Math.round(f.confidence * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Redact/Keep Button */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onToggleDecision(f.id, isRedacted ? 'keep' : 'redact')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                        isRedacted
                          ? 'bg-signal text-paper hover:bg-signal/90 shadow-sm'
                          : 'bg-paper/10 text-paper/60 hover:text-paper border border-paper/20'
                      }`}
                    >
                      {isRedacted ? 'Redacted' : 'Kept'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
