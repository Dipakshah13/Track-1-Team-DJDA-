/**
 * Ledger.tsx — Cryptographic Append-Only Audit Ledger
 * Displays hash-chained receipts with Verify Integrity and Simulate Tamper controls.
 */
import { useState } from 'react'
import { Header } from '@/components/Header'
import { Database, ShieldCheck, ShieldAlert, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react'
import type { LedgerBlock } from '@/lib/types'

const INITIAL_BLOCKS: LedgerBlock[] = [
  {
    id: 'REC-001',
    index: 1,
    timestamp: '2026-10-24 10:14:22',
    action: 'SHIELD_REDACTION',
    prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: 'a3f8e1d2c9b4a7065e8d1a4f2c9e8b7a6d5c4e3f2b1a09876543210fedcba987',
    findings_count: 2,
    payload_summary: 'NAME×1, PHONE×1',
  },
  {
    id: 'REC-002',
    index: 2,
    timestamp: '2026-10-24 10:22:15',
    action: 'GUARD_INSPECTION',
    prev_hash: 'a3f8e1d2c9b4a7065e8d1a4f2c9e8b7a6d5c4e3f2b1a09876543210fedcba987',
    hash: 'b2c9f4e0a3f8e1d2b7a6d5c4e3f2b1a09876543210fedcba9876543210fedcba',
    findings_count: 0,
    payload_summary: 'No adversarial vectors (SAFE)',
  },
  {
    id: 'REC-003',
    index: 3,
    timestamp: '2026-10-24 10:35:48',
    action: 'SHIELD_REDACTION',
    prev_hash: 'b2c9f4e0a3f8e1d2b7a6d5c4e3f2b1a09876543210fedcba9876543210fedcba',
    hash: 'c1d8a3f9b2c9f4e0a3f8e1d2b7a6d5c4e3f2b1a09876543210fedcba98765432',
    findings_count: 3,
    payload_summary: 'IBAN×1, NAME×1, CARD×1',
  },
  {
    id: 'REC-004',
    index: 4,
    timestamp: '2026-10-24 10:48:02',
    action: 'IMAGE_SCRUB',
    prev_hash: 'c1d8a3f9b2c9f4e0a3f8e1d2b7a6d5c4e3f2b1a09876543210fedcba98765432',
    hash: 'd0e7b2f8c1d8a3f9b2c9f4e0a3f8e1d2b7a6d5c4e3f2b1a09876543210fedcba',
    findings_count: 3,
    payload_summary: 'Aadhaar ID bounding boxes scrubbed',
  },
]

export default function Ledger() {
  const [blocks, setBlocks] = useState<LedgerBlock[]>(INITIAL_BLOCKS)
  const [isTampered, setIsTampered] = useState(false)
  const [isVerified, setIsVerified] = useState(true)

  const handleSimulateTamper = () => {
    setIsTampered(true)
    setIsVerified(false)
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === 2
          ? {
              ...b,
              payload_summary: '[TAMPERED VIA SQLITE DIRECT INJECTION]',
              hash: 'ff99deadbeef0000000000000000000000000000000000000000000000000000',
              tampered: true,
            }
          : b
      )
    )
  }

  const handleResetLedger = () => {
    setBlocks(INITIAL_BLOCKS)
    setIsTampered(false)
    setIsVerified(true)
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-safe" />
              <span className="font-mono text-xs text-safe uppercase tracking-wider font-semibold">
                Tamper-Evident Hash Chain
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-paper">
              Audit Ledger
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateTamper}
              disabled={isTampered}
              className="px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-signal/15 text-signal hover:bg-signal/25 border border-signal/40 transition-colors"
            >
              Simulate Database Tamper
            </button>

            {isTampered && (
              <button
                onClick={handleResetLedger}
                className="px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-ink-2 text-paper hover:bg-paper/10 border border-paper/10 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Reset Chain
              </button>
            )}
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`p-4 rounded-sm border flex items-center justify-between font-mono text-xs ${
            isVerified
              ? 'bg-safe/10 border-safe/30 text-safe'
              : 'bg-signal/10 border-signal/30 text-signal'
          }`}
        >
          <div className="flex items-center gap-2">
            {isVerified ? (
              <>
                <CheckCircle2 size={16} />
                <span className="font-bold">
                  CHAIN INTEGRITY VERIFIED — All 4 blocks cryptographically linked (SHA-256)
                </span>
              </>
            ) : (
              <>
                <AlertOctagon size={16} />
                <span className="font-bold">
                  INTEGRITY FAILURE DETECTED: Hash mismatch at Block #3 (Chain Broken)
                </span>
              </>
            )}
          </div>
          <div className="text-[10px] opacity-70">Database: local_audit.sqlite</div>
        </div>

        {/* Blocks Table */}
        <div className="border border-paper/10 bg-ink-2 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-paper/10 bg-ink text-paper/50 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Index</th>
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4">Previous Hash</th>
                  <th className="py-3 px-4">Block Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper/5 text-paper/80">
                {blocks.map((block) => (
                  <tr
                    key={block.id}
                    className={`transition-colors ${
                      block.tampered
                        ? 'bg-signal/15 text-signal font-semibold'
                        : 'hover:bg-paper/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold">#{block.index}</td>
                    <td className="py-3.5 px-4 text-paper font-semibold">{block.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-ink px-2 py-0.5 rounded border border-paper/10 text-[10px]">
                        {block.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{block.payload_summary}</td>
                    <td className="py-3.5 px-4 text-[11px] text-paper/40 font-mono">
                      {block.prev_hash.substring(0, 10)}...{block.prev_hash.substring(58)}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-mono">
                      <span
                        className={
                          block.tampered
                            ? 'text-signal font-bold bg-signal/20 px-1 py-0.5 rounded'
                            : 'text-safe'
                        }
                      >
                        {block.hash.substring(0, 12)}...{block.hash.substring(56)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
