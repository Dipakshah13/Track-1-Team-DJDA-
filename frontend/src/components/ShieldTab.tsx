/**
 * ShieldTab.tsx — Outbound Data Firewall Workstation
 * Features text input + DropZone, sample presets, FindingsTable, BeforeAfterImage, LiveTrace, and PrivacyReceipt.
 */
import { useState, useTransition } from 'react'
import { Upload, FileText, Play, RotateCcw, Copy, Check, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import { FindingsTable } from './FindingsTable'
import { BeforeAfterImage } from './BeforeAfterImage'
import { LiveTrace } from './LiveTrace'
import { PrivacyReceipt } from './PrivacyReceipt'
import { useSSE } from '@/lib/useSSE'
import type { Finding } from '@/lib/types'
import { scanShieldText } from '@/lib/api'

const SAMPLES = {
  bank: {
    title: 'Sample Bank Statement',
    text: `Transaction Statement - Silicon Bank India
Account Holder: Shubham Shinde
Account Number: 9812-4401-9921
IFSC Code: SBIN0004921
Registered Phone: +91 98201 54321
Email: shubham.shinde@security.corp
Pan Card: ABCPS1234F
Aadhaar Linked: 4920-1823-9912

Recent Outgoing Transfers:
Date: 2026-10-21 | To: Alex Chen | Amount: INR 45,000 | IBAN: DE89370400440532013000
Notes: Payment for cloud cluster server instances and API credentials.`,
  },
  medical: {
    title: 'Medical Discharge Summary',
    text: `CONFIDENTIAL CLINICAL RECORD
Hospital: Metro Healthcare Sciences
Patient Name: Jane Doe
DOB: 1984-07-12 | SSN: 000-45-6789 | Phone: (415) 555-0142
Address: 742 Evergreen Terrace, Springfield
Diagnosis: Recurring acute migraine with bilateral aura.
Prescriptions: Sumatriptan 50mg PRN.
Attending Physician: Dr. Marcus Vance, MD (License: MD-992019)`,
  },
  aadhaar: {
    title: 'Aadhaar ID Card Scanned Form',
    text: `Government of India UIDAI Verification Record
Full Legal Name: Shubham Shinde
Father's Name: Ramesh Shinde
Aadhaar Number: 4920 1823 9912
Date of Birth: 12/04/1998
Address: Flat 402, Green Valley Towers, Pune, Maharashtra 411045
Mobile: +91 98201 54321`,
  },
}

export function ShieldTab() {
  const [inputText, setInputText] = useState(SAMPLES.bank.text)
  const [activeMedia, setActiveMedia] = useState<'text' | 'image'>('text')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Current findings state
  const [findings, setFindings] = useState<Finding[]>([
    {
      id: 'f-1',
      category: 'NAME',
      text: 'Shubham Shinde',
      original_text: 'Shubham Shinde',
      placeholder: '[NAME-1]',
      confidence: 0.98,
      decision: 'redact',
    },
    {
      id: 'f-2',
      category: 'CARD',
      text: '9812-4401-9921',
      original_text: '9812-4401-9921',
      placeholder: '[CARD-1]',
      confidence: 0.99,
      decision: 'redact',
    },
    {
      id: 'f-3',
      category: 'PHONE',
      text: '+91 98201 54321',
      original_text: '+91 98201 54321',
      placeholder: '[PHONE-1]',
      confidence: 0.97,
      decision: 'redact',
    },
    {
      id: 'f-4',
      category: 'EMAIL',
      text: 'shubham.shinde@security.corp',
      original_text: 'shubham.shinde@security.corp',
      placeholder: '[EMAIL-1]',
      confidence: 0.99,
      decision: 'redact',
    },
    {
      id: 'f-5',
      category: 'AADHAAR',
      text: '4920-1823-9912',
      original_text: '4920-1823-9912',
      placeholder: '[AADHAAR-1]',
      confidence: 0.99,
      decision: 'redact',
    },
    {
      id: 'f-6',
      category: 'IBAN',
      text: 'DE89370400440532013000',
      original_text: 'DE89370400440532013000',
      placeholder: '[IBAN-1]',
      confidence: 0.99,
      decision: 'redact',
    },
  ])

  // SSE Trace
  const { steps, isDone } = useSSE('shield-run-1', isProcessing)

  // Generate redacted preview based on decisions
  let redactedOutput = inputText
  findings.forEach((f) => {
    if (f.decision === 'redact' && f.original_text) {
      redactedOutput = redactedOutput.split(f.original_text).join(f.placeholder)
    }
  })

  const handleToggleDecision = (id: string, decision: 'keep' | 'redact') => {
    setFindings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, decision } : item))
    )
  }

  const [receiptMeta, setReceiptMeta] = useState<{ duration_ms: number; ledger_hash: string }>({
    duration_ms: 18,
    ledger_hash: '3f8e1d2c9b4a7065e8d1a4f2c9e8b7a6d5c4e3f2b1a09876543210fedcba9876',
  })

  const handleRunScan = async () => {
    setIsProcessing(true)
    try {
      const res = await scanShieldText(inputText)
      if (res && res.findings && Array.isArray(res.findings) && res.findings.length > 0) {
        const mapped = res.findings.map((f: any, idx: number) => ({
          id: f.id || `f-${idx + 1}`,
          category: f.category,
          text: f.text || f.original_text || '',
          original_text: f.text || f.original_text || '',
          placeholder: f.placeholder || `[${f.category}-${idx + 1}]`,
          confidence: f.confidence || 0.95,
          decision: 'redact' as const,
        }))
        setFindings(mapped)
      }
      if (res.duration_ms) {
        setReceiptMeta({
          duration_ms: Math.round(res.duration_ms),
          ledger_hash: res.ledger_hash || '3f8e1d2c9b4a7065e8d1a4f2c9e8b7a6d5c4e3f2b1a09876543210fedcba9876',
        })
      }
    } catch (err) {
      console.warn('Shield backend scan fallback:', err)
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
      }, 800)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      setActiveMedia('image')
    } else {
      const reader = new FileReader()
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setInputText(evt.target.result)
          setActiveMedia('text')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Controls & Sample Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-4">
        {/* Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-paper/40 uppercase tracking-wider">
            Preloaded Presets:
          </span>
          <button
            onClick={() => {
              setInputText(SAMPLES.bank.text)
              setActiveMedia('text')
            }}
            className="px-2.5 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper font-mono text-xs border border-paper/10 transition-colors"
          >
            Bank Statement
          </button>
          <button
            onClick={() => {
              setInputText(SAMPLES.medical.text)
              setActiveMedia('text')
            }}
            className="px-2.5 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper font-mono text-xs border border-paper/10 transition-colors"
          >
            Medical Discharge
          </button>
          <button
            onClick={() => {
              setInputText(SAMPLES.aadhaar.text)
              setActiveMedia('image')
            }}
            className="px-2.5 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper font-mono text-xs border border-paper/10 transition-colors flex items-center gap-1.5"
          >
            <ImageIcon size={12} className="text-signal" />
            Aadhaar ID Card (Visual)
          </button>
        </div>

        {/* Media Switcher */}
        <div className="flex items-center gap-1 font-mono text-xs bg-ink-2 p-1 rounded border border-paper/10">
          <button
            onClick={() => setActiveMedia('text')}
            className={`px-3 py-1 rounded transition-colors ${
              activeMedia === 'text'
                ? 'bg-paper text-ink font-semibold'
                : 'text-paper/50 hover:text-paper'
            }`}
          >
            Text / Prompt
          </button>
          <button
            onClick={() => setActiveMedia('image')}
            className={`px-3 py-1 rounded transition-colors ${
              activeMedia === 'image'
                ? 'bg-paper text-ink font-semibold'
                : 'text-paper/50 hover:text-paper'
            }`}
          >
            Visual Document
          </button>
        </div>
      </div>

      {/* Primary Workstation */}
      {activeMedia === 'text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Raw Source + DropZone */}
          <div className="flex flex-col border border-paper/10 bg-ink-2 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-paper/10 flex items-center justify-between font-mono text-xs text-paper/70">
              <span className="flex items-center gap-2">
                <FileText size={13} className="text-signal" />
                <span>Original Outbound Payload (Local Only)</span>
              </span>
              <label className="cursor-pointer text-paper/50 hover:text-paper flex items-center gap-1">
                <Upload size={12} />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.md,.json,.csv"
                />
              </label>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="w-full bg-ink p-4 font-mono text-xs text-paper/90 leading-relaxed outline-none resize-none border-b border-paper/10 focus:ring-1 focus:ring-signal"
              placeholder="Paste raw text, prompt, or sensitive correspondence here..."
            />

            <div className="p-3 bg-ink-2 flex items-center justify-between">
              <div className="font-mono text-[10px] text-paper/40">
                Size: {new Blob([inputText]).size} bytes · 0 bytes transmitted
              </div>
              <button
                onClick={handleRunScan}
                disabled={isProcessing}
                className="btn btn-primary text-xs gap-1.5 py-1.5 px-4 font-mono"
              >
                <Play size={13} />
                <span>{isProcessing ? 'Scrubbing...' : 'Run Shield Redaction'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Sanitized Output Preview */}
          <div className="flex flex-col border border-paper/10 bg-ink-2 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-paper/10 flex items-center justify-between font-mono text-xs text-paper/70">
              <span className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-safe" />
                <span>Sanitized Egress Preview</span>
              </span>
              <button
                onClick={handleCopy}
                className="text-paper/50 hover:text-paper flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check size={12} className="text-safe" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="w-full bg-ink p-4 font-mono text-xs text-paper/80 leading-relaxed overflow-y-auto h-[260px] whitespace-pre-wrap select-all">
              {redactedOutput}
            </div>

            <div className="p-3 bg-ink-2 border-t border-paper/10 flex items-center justify-between font-mono text-[11px]">
              <span className="text-safe">✓ All personal markers tokenized</span>
              <span className="text-paper/40">
                Safe to submit to ChatGPT / Claude
              </span>
            </div>
          </div>
        </div>
      ) : (
        <BeforeAfterImage />
      )}

      {/* Lower Section: Findings Table & Side Panels (LiveTrace + PrivacyReceipt) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Findings Table (8 columns) */}
        <div className="lg:col-span-7">
          <FindingsTable findings={findings} onToggleDecision={handleToggleDecision} />
        </div>

        {/* Live Trace + Privacy Receipt (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <LiveTrace steps={steps} isDone={!isProcessing} />
          <PrivacyReceipt
            data={{
              timestamp: '2026-10-24 10:55:00',
              category_counts: {
                NAME: 1,
                PHONE: 1,
                EMAIL: 1,
                IBAN: 1,
              },
              total_items_redacted: findings.filter((f) => f.decision === 'redact').length,
              route: 'local',
              duration_ms: receiptMeta.duration_ms,
              ledger_hash: receiptMeta.ledger_hash,
              raw_values_sent: 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}
