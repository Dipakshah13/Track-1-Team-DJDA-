/**
 * ConsolePage — Shield console.
 * Split view: left input, right Original/Redacted tabs + findings list.
 * Privacy Receipt shown after processing.
 */
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Upload, FileText, Send, RotateCcw, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { FindingRow } from '@/components/FindingRow'
import { PrivacyReceipt } from '@/components/PrivacyReceipt'
import { pageVariants, fadeUpVariants } from '@/lib/motion'
import type { FindingWithDecision, ShieldResponse, PrivacyReceiptData, FindingCategory } from '@/lib/api'

// ─── Sample data (synthetic, no real PII) ────────────────────────────────
const SAMPLES = [
  {
    label: 'Bank dispute letter',
    text: `Hi, I need help drafting a dispute letter. My name is James Harrington and my account number is GB29NWBK60161331926819. I can be reached at james.harrington@email.com or +44 7911 123456. My address is 14 Elm Street, London, EC1A 1BB.`,
  },
  {
    label: 'Medical query',
    text: `I was prescribed metformin 500mg for Type 2 diabetes. My NHS number is 943 476 5634. Can you explain the side effects? My GP is Dr. Sarah Chen at Oakfield Surgery.`,
  },
  {
    label: 'Safe text (no findings)',
    text: `Can you explain the difference between supervised and unsupervised machine learning? I'm working on a project involving clustering algorithms.`,
  },
]

// ─── Mock shield call (returns synthetic findings) ────────────────────────
async function mockShieldText(text: string): Promise<ShieldResponse> {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 400))

  const findings = text.includes('James') ? [
    { id: 'f1', category: 'NAME'  as FindingCategory, start: 29, end: 45, confidence: 0.97 },
    { id: 'f2', category: 'IBAN'  as FindingCategory, start: 74, end: 96, confidence: 0.99 },
    { id: 'f3', category: 'EMAIL' as FindingCategory, start: 109, end: 135, confidence: 0.98 },
    { id: 'f4', category: 'PHONE' as FindingCategory, start: 140, end: 155, confidence: 0.95 },
    { id: 'f5', category: 'ADDRESS' as FindingCategory, start: 169, end: 200, confidence: 0.88 },
  ] : text.includes('metformin') ? [
    { id: 'f1', category: 'MEDICAL' as FindingCategory, start: 0, end: 50, confidence: 0.91 },
    { id: 'f2', category: 'SSN'    as FindingCategory, start: 90, end: 103, confidence: 0.96 },
    { id: 'f3', category: 'NAME'   as FindingCategory, start: 120, end: 134, confidence: 0.89 },
  ] : []

  const redactedText = findings.length > 0
    ? text.replace(/James Harrington|james\.harrington@email\.com|\+44 7911 123456|GB29NWBK60161331926819|14 Elm Street.*?BB|metformin.*?diabetes|943 476 5634|Dr\. Sarah Chen/g, '[REDACTED]')
    : text

  return {
    findings,
    redacted_text: redactedText,
    route: 'local',
    duration_ms: 800 + Math.floor(Math.random() * 400),
    ledger_hash: `sha256:${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
  }
}

type Tab = 'original' | 'redacted'

export function ConsolePage() {
  const shouldReduceMotion = useReducedMotion()
  const [inputText, setInputText] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('original')
  const [findings, setFindings] = useState<FindingWithDecision[]>([])
  const [response, setResponse] = useState<ShieldResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [receipt, setReceipt] = useState<PrivacyReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcess = useCallback(async () => {
    if (!inputText.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    setReceipt(null)
    setFindings([])

    try {
      setLoadingStep('Scanning for sensitive data on device…')
      await new Promise(r => setTimeout(r, 300))
      setLoadingStep('Running local Gemma 4 model…')

      const result = await mockShieldText(inputText)

      setResponse(result)
      setFindings(result.findings.map(f => ({ ...f, decision: 'redact' as const })))
      setActiveTab('original')

      // Build receipt
      const counts: Partial<Record<FindingCategory, number>> = {}
      for (const f of result.findings) {
        counts[f.category] = (counts[f.category] ?? 0) + 1
      }

      setReceipt({
        timestamp: new Date().toISOString(),
        category_counts: counts,
        total_items_redacted: result.findings.length,
        route: result.route,
        duration_ms: result.duration_ms,
        ledger_hash: result.ledger_hash,
        raw_values_sent: 0,
      })
    } catch (e) {
      setError('Processing failed. No data was sent. Check that the local model is running.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }, [inputText])

  const handleToggleFinding = useCallback((id: string, decision: 'keep' | 'redact') => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, decision } : f))
  }, [])

  const handleReset = () => {
    setInputText('')
    setResponse(null)
    setFindings([])
    setReceipt(null)
    setError(null)
    setLoadingStep('')
  }

  const handleSample = (sample: typeof SAMPLES[0]) => {
    setInputText(sample.text)
    setResponse(null)
    setFindings([])
    setReceipt(null)
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
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-ink tracking-tight">Shield</h1>
            <p className="font-sans text-sm text-muted mt-0.5">
              Redact private data before sending to a cloud AI.
            </p>
          </div>
          {response && (
            <button onClick={handleReset} className="btn btn-ghost-dark text-xs gap-1.5">
              <RotateCcw size={13} />
              New scan
            </button>
          )}
        </div>

        {/* Main split layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input panel */}
          <div className="w-1/2 border-r border-line flex flex-col">
            {/* Sample picker */}
            <div className="px-4 py-3 border-b border-line flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted">Samples:</span>
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSample(s)}
                  className="font-mono text-xs px-2 py-1 border border-line rounded-sm hover:border-muted hover:bg-paper-2 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                className="w-full h-full resize-none bg-transparent font-sans text-sm text-ink p-4 placeholder:text-muted/60 focus:outline-none"
                placeholder="Paste text, drop a file, or pick a sample above…"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                aria-label="Input text to scan"
              />
              {/* File drop zone overlay when empty */}
              {!inputText && (
                <div
                  className="absolute inset-4 border-2 border-dashed border-line rounded-sm flex flex-col items-center justify-center gap-2 text-muted pointer-events-none"
                  aria-hidden="true"
                >
                  <Upload size={20} />
                  <span className="font-mono text-xs">Drop a file or paste text</span>
                </div>
              )}
            </div>

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,image/*"
              aria-label="Upload file for scanning"
            />

            {/* Actions */}
            <div className="px-4 py-3 border-t border-line flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost-dark text-xs gap-1.5"
                aria-label="Upload file"
              >
                <FileText size={13} />
                Upload file
              </button>
              <div className="flex-1" />
              <span className="font-mono text-xs text-muted">
                {inputText.length} chars
              </span>
              <button
                onClick={handleProcess}
                disabled={!inputText.trim() || loading}
                className="btn btn-primary gap-1.5"
                aria-label="Scan and redact sensitive data"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-paper/40 border-t-paper rounded-full animate-spin" />
                    Scanning…
                  </span>
                ) : (
                  <>
                    <Send size={13} />
                    Scan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Results panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-5 h-5 border-2 border-line border-t-ink rounded-full animate-spin" />
                  <p className="font-mono text-xs text-muted text-center">{loadingStep}</p>
                  <p className="font-mono text-xs text-muted opacity-50 text-center">
                    Processing on this device. Nothing sent yet.
                  </p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                >
                  <p className="font-sans text-sm font-medium text-signal text-center">{error}</p>
                  <p className="font-mono text-xs text-muted text-center">No data was sent or stored.</p>
                </motion.div>
              ) : response ? (
                <motion.div
                  key="results"
                  className="flex-1 flex flex-col overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Tabs */}
                  <div className="flex border-b border-line px-4 pt-3 relative" role="tablist">
                    {(['original', 'redacted'] as Tab[]).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                          mr-6 pb-3 font-mono text-xs font-semibold tracking-wide uppercase
                          transition-colors relative
                          ${activeTab === tab ? 'text-ink' : 'text-muted hover:text-ink'}
                        `}
                      >
                        {tab === 'original' ? 'Original (local only)' : 'Redacted (safe to send)'}
                        {activeTab === tab && (
                          <motion.div
                            layoutId="tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-auto p-4">
                    <AnimatePresence mode="wait">
                      {activeTab === 'original' ? (
                        <motion.div
                          key="original"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 4 }}
                          transition={{ duration: 0.2 }}
                          role="tabpanel"
                          aria-label="Original text (local only)"
                        >
                          <div
                            className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap p-3 bg-paper-2 rounded-sm border border-line"
                          >
                            {inputText}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="redacted"
                          initial={{ opacity: 0, x: 4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.2 }}
                          role="tabpanel"
                          aria-label="Redacted text safe to send"
                        >
                          <div className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap p-3 bg-paper-2 rounded-sm border border-line">
                            {response.redacted_text}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="font-mono text-xs text-muted">
                              Route: {response.route === 'local' ? 'Local inference only' : 'Cloud (redacted text only)'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Findings list */}
                  {findings.length > 0 && (
                    <div className="border-t border-line">
                      <div className="px-4 py-3 flex items-center justify-between border-b border-line">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {findings.length} finding{findings.length !== 1 ? 's' : ''}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          Toggle Keep/Redact per item
                        </span>
                      </div>
                      <div className="p-4 space-y-2 max-h-48 overflow-auto">
                        <AnimatePresence>
                          {findings.map((finding) => (
                            <FindingRow
                              key={finding.id}
                              finding={finding}
                              showRawText={activeTab === 'original'}
                              onToggle={handleToggleFinding}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Privacy receipt */}
                  {receipt && (
                    <div className="border-t border-line p-4 bg-paper-2">
                      <PrivacyReceipt data={receipt} />
                    </div>
                  )}

                  {/* No findings state */}
                  {findings.length === 0 && !loading && (
                    <div className="px-4 py-3 border-t border-line">
                      <p className="font-mono text-xs text-muted">
                        Nothing sensitive detected. This is not a guarantee.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Empty state */
                <motion.div
                  key="empty"
                  className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="w-12 h-12 border border-line rounded-sm flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Send size={18} className="text-muted" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans text-sm font-medium text-ink">Paste text to begin</p>
                    <p className="font-mono text-xs text-muted mt-1">
                      Scanned on this device. Nothing leaves until you say so.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSample(SAMPLES[0])}
                    className="btn btn-ghost-dark text-xs"
                  >
                    Try a sample
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AppShell>
  )
}
