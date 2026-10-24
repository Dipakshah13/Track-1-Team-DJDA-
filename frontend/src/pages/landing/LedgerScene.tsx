import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { Card3D } from '@/components/Card3D'
import { fetchLedgerEntries, tamperLedgerBlock, verifyLedgerChain } from '@/lib/api'
import { useSecurity } from '@/context/SecurityContext'
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, Lock } from 'lucide-react'

const DEFAULT_BLOCKS = [
  { id: 'B001', hash: 'a3f8e1d2', prev: '00000000', op: 'shield', counts: 'NAME×1, PHONE×1', doc: 'Bank Statement' },
  { id: 'B002', hash: 'b2c9f4e0', prev: 'a3f8e1d2', op: 'guard',  counts: 'no findings', doc: 'Prompt Scan' },
  { id: 'B003', hash: 'c1d8a3f9', prev: 'b2c9f4e0', op: 'shield', counts: 'IBAN×1, NAME×2', doc: 'Wire Transfer' },
  { id: 'B004', hash: 'd0e7b2f8', prev: 'c1d8a3f9', op: 'shield', counts: 'MEDICAL×1', doc: 'Clinical Record' },
  { id: 'B005', hash: 'e9f6c1a7', prev: 'd0e7b2f8', op: 'guard',  counts: 'no findings', doc: 'System Prompt' },
]

export function LedgerScene() {
  const shouldReduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [tamperedIdx, setTamperedIdx] = useState<number | null>(null)
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS)

  const { docInfo, ledgerBlocks, findings } = useSecurity()

  useEffect(() => {
    fetchLedgerEntries(6)
      .then((entries) => {
        if (entries && Array.isArray(entries) && entries.length > 0) {
          const mapped = entries.map((e, idx) => ({
            id: `B${String(e.id || idx + 1).padStart(3, '0')}`,
            hash: (e.entry_hash || e.hash || 'e3b0c442').slice(0, 8),
            prev: (e.prev_hash || '00000000').slice(0, 8),
            op: (e.action || e.operation || 'shield').toLowerCase().replace('_redaction', ''),
            counts: e.meta?.counts_by_category
              ? Object.entries(e.meta.counts_by_category)
                  .map(([cat, count]) => `${cat}×${count}`)
                  .join(', ') || 'clean'
              : `${e.findings_count ?? (e.meta?.total_findings ?? 0)} finding${(e.findings_count || e.meta?.total_findings) === 1 ? '' : 's'}`,
            doc: e.meta?.document || `Entry #${e.id || idx + 1}`,
          }))
          setBlocks(mapped)
        }
      })
      .catch((err) => console.warn('Ledger fetch fallback:', err))
  }, [ledgerBlocks])

  return (
    <div className="section-paper py-32 px-6 md:px-12 lg:px-20 border-t border-paper/10 relative overflow-hidden" ref={ref} id="ledger">
      <div className="max-w-3xl mx-auto relative z-10">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">Cryptographic Ledger</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <h2
              className="font-display text-paper"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.0', letterSpacing: '-0.03em' }}
            >
              Tamper-evident proof.
            </h2>

            {/* Live Document Audit Pill */}
            <div className="bg-ink-2 border border-paper/15 p-2 rounded text-xs font-mono flex items-center gap-2 self-start sm:self-auto shadow-md">
              <Lock size={12} className="text-safe" />
              <span className="text-paper/60 uppercase text-[10px]">Audited Target:</span>
              <span className="text-paper font-bold">{docInfo.name}</span>
              <span className="text-safe text-[10px] font-bold">SEALED</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-sans text-paper/70 text-base leading-relaxed max-w-xl mb-4">
            Every operation is chained by its SHA-256 hash. Alter one record in SQLite and the break
            propagates visibly through the Merkle tree. Zero raw secrets are ever committed.
          </p>
          <p className="font-mono text-xs text-signal font-bold mb-12 flex items-center gap-1.5">
            <AlertTriangle size={13} />
            <span>Click any block below to simulate database tampering:</span>
          </p>
        </Reveal>

        <div className="max-w-sm mx-auto space-y-3">
          {blocks.map((block, idx) => {
            const isTampered = tamperedIdx !== null && idx >= tamperedIdx
            const isFirstBad = idx === tamperedIdx

            return (
              <div key={block.id}>
                <Card3D glowColor={isTampered ? 'rgba(255,75,43,0.35)' : 'rgba(46,139,87,0.25)'}>
                  <motion.div
                    className={`border rounded-sm p-4 cursor-pointer font-mono text-xs select-none transition-all shadow-xl ${
                      isTampered
                        ? 'border-signal bg-signal/15 text-signal font-bold'
                        : 'border-paper/20 bg-ink-2 text-paper/90 hover:border-paper/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const nextIdx = tamperedIdx === idx ? null : idx
                      setTamperedIdx(nextIdx)
                      if (nextIdx !== null) {
                        tamperLedgerBlock(nextIdx + 1).catch(() => {})
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Block ${idx + 1}${isTampered ? ' — tampered' : ''}`}
                    onKeyDown={e => e.key === 'Enter' && setTamperedIdx(prev => prev === idx ? null : idx)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-paper flex items-center gap-1.5">
                        <span className="text-safe">#</span>
                        <span>{block.id}</span>
                      </span>
                      <span className="text-paper/50 uppercase text-[10px] bg-ink px-1.5 py-0.5 rounded border border-paper/10">
                        {block.op}
                      </span>
                      {isFirstBad && (
                        <motion.span
                          className="text-signal font-bold animate-pulse text-[10px]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          TAMPER DETECTED
                        </motion.span>
                      )}
                    </div>
                    <div className="text-paper/70 text-[11px] mb-2 truncate">
                      {block.counts}
                    </div>
                    <div className="flex gap-2 items-center text-[11px]">
                      <span className="text-paper/40 text-[10px]">hash:</span>
                      <span className={isTampered ? 'line-through text-signal font-bold' : 'text-safe'}>
                        {isTampered && isFirstBad ? 'DEADBEEF00000000' : block.hash}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center mt-1 text-[11px]">
                      <span className="text-paper/40 text-[10px]">prev:</span>
                      <span className={isTampered && idx > 0 ? 'text-signal' : 'text-paper/40'}>{block.prev}</span>
                    </div>
                  </motion.div>
                </Card3D>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
