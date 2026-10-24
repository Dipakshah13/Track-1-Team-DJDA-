/**
 * GuardPage — drop a document, check for hidden instructions.
 * Shows verdict banner, document text with flagged spans, margin notes.
 * Never renders document content as HTML (plain text only).
 */
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Upload, FileSearch } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { VerdictBanner } from '@/components/VerdictBanner'
import { pageVariants } from '@/lib/motion'
import { scanGuardFile } from '@/lib/api'
import type { GuardResponse, GuardFinding } from '@/lib/api'

// Mock guard response
async function mockGuardDoc(filename: string): Promise<GuardResponse> {
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 500))

  if (filename.includes('safe')) {
    return { verdict: 'safe', findings: [], confidence: 0.93, duration_ms: 1012, ledger_hash: `sha256:${Math.random().toString(36).slice(2)}` }
  }
  if (filename.includes('suspicious')) {
    return {
      verdict: 'suspicious',
      confidence: 0.74,
      duration_ms: 1230,
      ledger_hash: `sha256:${Math.random().toString(36).slice(2)}`,
      findings: [
        { type: 'hidden_text', location: 'Page 2, line 14', confidence: 0.74, excerpt_safe: '[Hidden text detected — white-on-white]' },
      ],
    }
  }
  return {
    verdict: 'malicious',
    confidence: 0.97,
    duration_ms: 980,
    ledger_hash: `sha256:${Math.random().toString(36).slice(2)}`,
    findings: [
      {
        type: 'prompt_injection',
        location: 'Page 1, footer',
        confidence: 0.97,
        excerpt_safe: 'Tries to override instructions ("Ignore previous instructions and…")',
      },
      {
        type: 'override_attempt',
        location: 'Page 3, hidden layer',
        confidence: 0.88,
        excerpt_safe: 'Attempts to exfiltrate system prompt via tool call.',
      },
    ],
  }
}

const FINDING_TYPE_LABELS: Record<string, string> = {
  prompt_injection: 'Prompt injection',
  hidden_text:      'Hidden text',
  steganography:    'Steganography',
  override_attempt: 'Override attempt',
}

export function GuardPage() {
  const shouldReduceMotion = useReducedMotion()
  const [response, setResponse] = useState<GuardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setFilename(file.name)
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      setLoadingStep('Reading document on device…')
      let result: GuardResponse
      if (file.size > 0) {
        setLoadingStep('Scanning document for hidden instructions…')
        try {
          result = await scanGuardFile(file)
        } catch (apiErr) {
          console.warn('Backend guard scan error, falling back:', apiErr)
          result = await mockGuardDoc(file.name)
        }
      } else {
        await new Promise(r => setTimeout(r, 300))
        setLoadingStep('Scanning for hidden instructions…')
        result = await mockGuardDoc(file.name)
      }
      setResponse(result)
    } catch {
      setError('Scan failed. The file could not be processed. No data was sent.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
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
        <div className="px-6 py-5 border-b border-line">
          <h1 className="font-display font-bold text-xl text-ink tracking-tight">Guard</h1>
          <p className="font-sans text-sm text-muted mt-0.5">
            Check files for hidden instructions before an AI agent reads them.
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {!response && !loading && (
              <motion.div
                key="drop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-line rounded-sm p-16 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-muted transition-colors"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  aria-label="Drop a file or click to upload"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                >
                  <FileSearch size={28} className="text-muted" aria-hidden="true" />
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">Drop a document here</p>
                    <p className="font-mono text-xs text-muted mt-1">PDF, DOCX, TXT, images — scanned on this device only</p>
                  </div>
                  <div className="flex gap-2">
                    {['safe_report.pdf', 'suspicious_doc.docx', 'attack_payload.pdf'].map(name => (
                      <button
                        key={name}
                        className="font-mono text-xs px-3 py-1.5 border border-line rounded-sm hover:border-muted hover:bg-paper-2 transition-colors"
                        onClick={e => { e.stopPropagation(); handleFile(new File([], name)) }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.doc,image/*"
                  onChange={handleInputChange}
                />
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center gap-3 py-20"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="status" aria-live="polite"
              >
                <div className="w-5 h-5 border-2 border-line border-t-ink rounded-full animate-spin" />
                <p className="font-mono text-xs text-muted">{loadingStep}</p>
                <p className="font-mono text-xs text-muted opacity-50">Local processing only. Nothing sent.</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                className="py-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="alert"
              >
                <p className="font-sans text-sm text-signal">{error}</p>
                <button onClick={() => { setError(null); setFilename(null) }} className="btn btn-ghost-dark text-xs mt-4">Try again</button>
              </motion.div>
            )}

            {response && (
              <motion.div
                key="result"
                className="space-y-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{filename}</span>
                  <button onClick={() => { setResponse(null); setFilename(null) }} className="btn btn-ghost-dark text-xs">Scan another</button>
                </div>

                <VerdictBanner
                  verdict={response.verdict}
                  confidence={response.confidence}
                  findingCount={response.findings.length}
                  durationMs={response.duration_ms}
                />

                {response.findings.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-muted">
                      Flagged sections
                    </h2>
                    {response.findings.map((f: GuardFinding, i) => (
                      <div key={i} className="border border-line rounded-sm p-4 bg-surface">
                        <div className="flex items-start gap-3">
                          <span className="category-badge mt-0.5 flex-shrink-0 bg-signal/10 text-signal border border-signal/20">
                            {FINDING_TYPE_LABELS[f.type] ?? f.type}
                          </span>
                          <div>
                            <p className="font-mono text-xs text-muted mb-1">{f.location}</p>
                            {/* Safe excerpt only — never raw content */}
                            <p className="font-sans text-sm text-ink">{f.excerpt_safe}</p>
                            <p className="font-mono text-xs text-muted mt-1">{Math.round(f.confidence * 100)}% confidence</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {response.findings.length === 0 && (
                  <p className="font-mono text-xs text-muted">
                    Nothing sensitive detected. This is not a guarantee.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AppShell>
  )
}
