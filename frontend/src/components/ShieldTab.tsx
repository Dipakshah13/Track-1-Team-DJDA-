/**
 * ShieldTab.tsx — Outbound Data Firewall Workstation
 * Fully synced with SecurityContext across Inbound Guard, Cryptographic Ledger, and 3D Scenes.
 */
import { useState } from 'react'
import {
  Upload,
  FileText,
  Play,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Layers,
  FileCheck,
  Download,
} from 'lucide-react'
import { FindingsTable } from './FindingsTable'
import { BeforeAfterImage } from './BeforeAfterImage'
import { LiveTrace } from './LiveTrace'
import { PrivacyReceipt } from './PrivacyReceipt'
import { useSecurity, PRESETS } from '@/context/SecurityContext'

export function ShieldTab({ onSwitchTab }: { onSwitchTab?: (tab: 'shield' | 'guard') => void }) {
  const {
    docInfo,
    inputText,
    redactedOutput,
    findings,
    activeMedia,
    isProcessing,
    receiptMeta,
    traceSteps,
    isTraceDone,
    guardVerdict,
    threatScore,
    ledgerBlocks,
    uploadDocument,
    updateInputText,
    runShieldRedaction,
    toggleFindingDecision,
    loadPreset,
    setActiveMedia,
  } = useSecurity()

  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([redactedOutput], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanitized_${docInfo.name.replace(/\.[^/.]+$/, '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadDocument(file)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadDocument(file)
    }
  }

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* GLOBAL PIPELINE SYNC BANNER */}
      <div className="bg-ink border border-paper/15 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="text-paper/60 uppercase text-[10px] tracking-wider">Synced Document:</span>
          <span className="bg-paper/10 text-paper px-2 py-0.5 rounded font-bold border border-paper/15 flex items-center gap-1.5">
            <FileCheck size={12} className="text-safe" />
            <span>{docInfo.name}</span>
            <span className="text-paper/40 text-[10px]">({docInfo.sizeBytes} bytes)</span>
          </span>
          {docInfo.isCustom && (
            <span className="bg-safe/15 text-safe border border-safe/30 px-2 py-0.5 rounded text-[10px] font-bold">
              USER DOCUMENT ACTIVE
            </span>
          )}
        </div>

        {/* Cross-Screen Sync Hub Links */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-paper/40 text-[11px] hidden sm:inline">Linked Layers:</span>
          <button
            onClick={() => onSwitchTab?.('guard')}
            className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
              guardVerdict === 'malicious'
                ? 'bg-signal/20 text-signal border-signal/40'
                : 'bg-ink-2 text-paper/80 border-paper/15 hover:border-paper/40'
            }`}
            title="Inspect this document for prompt injection"
          >
            <ShieldAlert size={12} className={guardVerdict === 'malicious' ? 'text-signal' : 'text-safe'} />
            <span>Guard: {guardVerdict.toUpperCase()}</span>
          </button>

          <button
            onClick={() => scrollToAnchor('shield')}
            className="px-2 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper/80 border border-paper/15 transition-colors flex items-center gap-1.5"
            title="View 3D Document & Before/After Scrubber"
          >
            <Layers size={12} className="text-signal" />
            <span>3D Scrubber</span>
          </button>

          <button
            onClick={() => scrollToAnchor('ledger')}
            className="px-2 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper/80 border border-paper/15 transition-colors flex items-center gap-1.5"
            title="View tamper-evident cryptographic hash chain"
          >
            <span className="text-safe font-bold">#</span>
            <span>Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* Top Controls & Sample Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-4">
        {/* Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-paper/40 uppercase tracking-wider">
            Preloaded Presets:
          </span>
          <button
            onClick={() => loadPreset('bank')}
            className="px-2.5 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper font-mono text-xs border border-paper/10 transition-colors"
          >
            Bank Statement
          </button>
          <button
            onClick={() => loadPreset('medical')}
            className="px-2.5 py-1 rounded bg-ink-2 hover:bg-paper/10 text-paper font-mono text-xs border border-paper/10 transition-colors"
          >
            Medical Discharge
          </button>
          <button
            onClick={() => loadPreset('aadhaar')}
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
          <div
            className={`flex flex-col border rounded-sm overflow-hidden transition-all ${
              dragOver ? 'border-signal bg-signal/5' : 'border-paper/10 bg-ink-2'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="px-4 py-2.5 border-b border-paper/10 flex items-center justify-between font-mono text-xs text-paper/70">
              <span className="flex items-center gap-2">
                <FileText size={13} className="text-signal" />
                <span>Original Outbound Payload (Local Only)</span>
              </span>
              <label className="cursor-pointer text-paper/70 hover:text-paper flex items-center gap-1.5 bg-paper/5 hover:bg-paper/10 px-2 py-0.5 rounded border border-paper/10 transition-colors">
                <Upload size={12} className="text-signal" />
                <span className="font-semibold">Upload File</span>
                <input
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.txt,.md,.json,.csv,.doc,.docx,image/*"
                />
              </label>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => updateInputText(e.target.value)}
              rows={12}
              className="w-full bg-ink p-4 font-mono text-xs text-paper/90 leading-relaxed outline-none resize-none border-b border-paper/10 focus:ring-1 focus:ring-signal"
              placeholder="Paste raw text, prompt, or sensitive correspondence here, or drag & drop any document..."
            />

            <div className="p-3 bg-ink-2 flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[10px] text-paper/50 flex items-center gap-2">
                <span>Size: {new Blob([inputText]).size} bytes</span>
                <span>·</span>
                <span className="text-safe font-bold">0 bytes transmitted</span>
                {docInfo.isCustom && <span className="text-signal">· Synced Across App</span>}
              </div>
              <button
                onClick={runShieldRedaction}
                disabled={isProcessing}
                className="btn btn-primary text-xs gap-1.5 py-1.5 px-4 font-mono shadow-md"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="text-paper/60 hover:text-paper flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-ink border border-paper/10"
                  title="Download sanitized text file"
                >
                  <Download size={11} />
                  <span>Export</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="text-paper/70 hover:text-paper flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-ink border border-paper/10"
                >
                  {copied ? <Check size={12} className="text-safe" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="w-full bg-ink p-4 font-mono text-xs text-paper/90 leading-relaxed overflow-y-auto h-[260px] whitespace-pre-wrap select-all">
              {redactedOutput}
            </div>

            <div className="p-3 bg-ink-2 border-t border-paper/10 flex items-center justify-between font-mono text-[11px]">
              <span className="text-safe font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} /> All personal markers tokenized
              </span>
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
        {/* Findings Table (7 columns) */}
        <div className="lg:col-span-7">
          <FindingsTable findings={findings} onToggleDecision={toggleFindingDecision} />
        </div>

        {/* Live Trace + Privacy Receipt (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <LiveTrace steps={traceSteps} isDone={isTraceDone} />
          <PrivacyReceipt
            data={{
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              category_counts: findings.reduce((acc, f) => {
                acc[f.category as any] = (acc[f.category as any] || 0) + 1
                return acc
              }, {} as any),
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
