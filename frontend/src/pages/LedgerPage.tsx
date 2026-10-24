/**
 * LedgerPage — tamper-evident hash chain viewer.
 * "Verify chain" lights each link green in sequence; tampered link goes red.
 * No raw sensitive values stored.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Copy, Check, ShieldAlert } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { pageVariants, spring } from '@/lib/motion'
import type { LedgerEntry } from '@/lib/api'

// Synthetic ledger entries — no raw PII
const MOCK_ENTRIES: LedgerEntry[] = [
  {
    id: 'e001',
    timestamp: '2026-10-24T04:12:01Z',
    operation: 'shield',
    category_counts: { NAME: 1, PHONE: 1, EMAIL: 1 },
    route: 'local',
    hash: 'a3f8e1d29b4c7a06f1e3d9b27c4a8f12',
    prev_hash: '0000000000000000000000000000000000',
  },
  {
    id: 'e002',
    timestamp: '2026-10-24T04:15:44Z',
    operation: 'guard',
    category_counts: {},
    route: 'local',
    hash: 'b2c9f4e07d3a1b85e2f4d8c16a3b9f23',
    prev_hash: 'a3f8e1d29b4c7a06f1e3d9b27c4a8f12',
  },
  {
    id: 'e003',
    timestamp: '2026-10-24T04:18:22Z',
    operation: 'shield',
    category_counts: { IBAN: 1, NAME: 2 },
    route: 'local',
    hash: 'c1d8a3f96e2b0c74d3e5a7b28f4c0d34',
    prev_hash: 'b2c9f4e07d3a1b85e2f4d8c16a3b9f23',
  },
  {
    id: 'e004',
    timestamp: '2026-10-24T04:22:11Z',
    operation: 'shield',
    category_counts: { MEDICAL: 1 },
    route: 'local',
    hash: 'd0e7b2f85d1a9c63e4d6f8a29b5d1e45',
    prev_hash: 'c1d8a3f96e2b0c74d3e5a7b28f4c0d34',
  },
  {
    id: 'e005',
    timestamp: '2026-10-24T04:25:58Z',
    operation: 'guard',
    category_counts: {},
    route: 'local',
    hash: 'e9f6c1a74e2b8d52f5e7g9c30a6e2f56',
    prev_hash: 'd0e7b2f85d1a9c63e4d6f8a29b5d1e45',
  },
]

type VerifyState = 'idle' | 'running' | 'done'
type BlockState = 'unverified' | 'valid' | 'tampered'

export function LedgerPage() {
  const shouldReduceMotion = useReducedMotion()
  const [entries] = useState(MOCK_ENTRIES)
  const [blockStates, setBlockStates] = useState<BlockState[]>(entries.map(() => 'unverified'))
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [firstBadIndex, setFirstBadIndex] = useState<number | null>(null)
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleTamper = useCallback((idx: number) => {
    setTamperedIndex(prev => prev === idx ? null : idx)
    // Reset verification
    setBlockStates(entries.map(() => 'unverified'))
    setVerifyState('idle')
    setFirstBadIndex(null)
  }, [entries])

  const handleVerify = useCallback(async () => {
    setVerifyState('running')
    setBlockStates(entries.map(() => 'unverified'))
    setFirstBadIndex(null)

    const delay = shouldReduceMotion ? 0 : 350

    let badIdx: number | null = null

    for (let i = 0; i < entries.length; i++) {
      await new Promise(r => setTimeout(r, delay))
      const isTampered = tamperedIndex === i || (tamperedIndex !== null && i > tamperedIndex)

      if (isTampered && badIdx === null) {
        badIdx = i
      }

      setBlockStates(prev => {
        const next = [...prev]
        next[i] = (badIdx !== null && i >= badIdx) ? 'tampered' : 'valid'
        return next
      })
    }

    setFirstBadIndex(badIdx)
    setVerifyState('done')
  }, [entries, tamperedIndex, shouldReduceMotion])

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(hash)
      setTimeout(() => setCopiedHash(null), 1500)
    } catch { /* ignore */ }
  }

  return (
    <AppShell dataLocation="LOCAL_ONLY">
      <motion.div
        className="h-full flex flex-col"
        variants={shouldReduceMotion ? undefined : pageVariants}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate="visible"
        exit="exit"
      >
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-ink tracking-tight">Ledger</h1>
            <p className="font-sans text-sm text-muted mt-0.5">
              Tamper-evident, hash-chained audit log. No raw secrets stored here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tamperedIndex !== null && (
              <span className="font-mono text-xs text-signal flex items-center gap-1">
                <ShieldAlert size={12} />
                Block {tamperedIndex + 1} tampered
              </span>
            )}
            <button
              onClick={handleVerify}
              disabled={verifyState === 'running'}
              className="btn btn-ghost-dark text-xs"
            >
              {verifyState === 'running' ? 'Verifying…' : 'Verify chain'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Instructions */}
          {verifyState === 'idle' && tamperedIndex === null && (
            <p className="font-mono text-xs text-muted mb-6">
              Click any block to simulate tampering, then press "Verify chain" to see the break cascade.
            </p>
          )}

          {/* Result banner */}
          <AnimatePresence>
            {verifyState === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-6 p-3 border rounded-sm font-mono text-xs ${
                  firstBadIndex === null
                    ? 'border-safe/40 bg-safe/5 text-safe'
                    : 'border-signal/40 bg-signal/5 text-signal'
                }`}
              >
                {firstBadIndex === null
                  ? '✓ Chain intact. All hashes verified.'
                  : `✗ First bad block: #${firstBadIndex + 1} (${entries[firstBadIndex].id}). Chain broken from here.`
                }
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chain */}
          <div className="max-w-xl mx-auto">
            {entries.map((entry, idx) => {
              const state = blockStates[idx]
              const isTampered = tamperedIndex === idx
              return (
                <div key={entry.id}>
                  {/* Block */}
                  <motion.div
                    className={`ledger-block cursor-pointer select-none ${
                      state === 'tampered' || isTampered ? 'ledger-block--tampered' : ''
                    }`}
                    animate={
                      state === 'valid' ? { borderColor: 'var(--color-safe)', backgroundColor: 'rgba(46,139,87,0.04)' } :
                      state === 'tampered' ? { borderColor: 'var(--color-signal)', backgroundColor: 'rgba(255,75,43,0.04)' } :
                      { borderColor: 'var(--color-line)', backgroundColor: 'var(--color-surface)' }
                    }
                    transition={spring.default}
                    onClick={() => handleTamper(idx)}
                    role="button"
                    aria-label={`Block ${idx + 1}${isTampered ? ' — tampered' : ''}`}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleTamper(idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold text-ink">Block {idx + 1}</span>
                        <span className="ml-2 text-muted">{entry.operation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTampered && (
                          <span className="font-mono text-xs text-signal tracking-wide">TAMPERED</span>
                        )}
                        <span className={`
                          font-mono text-xs
                          ${state === 'valid' ? 'text-safe' : state === 'tampered' ? 'text-signal' : 'text-muted'}
                        `}>
                          {state === 'valid' ? '✓ valid' : state === 'tampered' ? '✗ invalid' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-muted mb-2 text-xs">{entry.timestamp}</div>
                    <div className="text-muted text-xs mb-2">
                      {Object.entries(entry.category_counts).length > 0
                        ? Object.entries(entry.category_counts).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : 'No findings recorded'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`hash-text truncate max-w-xs ${isTampered ? 'line-through opacity-50' : ''}`}>
                        {isTampered ? 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' : entry.hash}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); copyHash(entry.hash) }}
                        className="ml-2 p-1 text-muted hover:text-ink transition-colors flex-shrink-0"
                        aria-label={`Copy hash for block ${idx + 1}`}
                      >
                        {copiedHash === entry.hash ? <Check size={12} className="text-safe" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Connector */}
                  {idx < entries.length - 1 && (
                    <motion.div
                      className="ledger-connector"
                      animate={{
                        backgroundColor:
                          blockStates[idx] === 'tampered' || blockStates[idx + 1] === 'tampered'
                            ? 'var(--color-signal)'
                            : blockStates[idx] === 'valid'
                            ? 'var(--color-safe)'
                            : 'var(--color-line)',
                      }}
                      transition={spring.default}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AppShell>
  )
}
