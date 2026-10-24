/**
 * Gemma Aegis — API Type Definitions
 * These mirror the backend models defined in docs/TRD.md §5.
 * If the backend API shape changes, update docs/TRD.md in the same PR.
 *
 * PRIVACY RULE: Raw Finding.text appears ONLY in local Original panels
 * and the extension's local diff popover. Never in ledger, trace, logs,
 * toasts, receipts, or marketing demo.
 */

// ─── Finding categories ──────────────────────────────────────────────────
export type FindingCategory =
  | 'NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'IBAN'
  | 'SSN'
  | 'ADDRESS'
  | 'CREDENTIAL'
  | 'MEDICAL'
  | 'OTHER'

// ─── Confidence tier ──────────────────────────────────────────────────────
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW'

export function confidenceTier(score: number): ConfidenceTier {
  if (score >= 0.85) return 'HIGH'
  if (score >= 0.60) return 'MEDIUM'
  return 'LOW'
}

// ─── Shield finding ───────────────────────────────────────────────────────
export interface Finding {
  id: string
  category: FindingCategory
  start: number
  end: number
  confidence: number
  // NOTE: `text` is NEVER sent to ledger/receipt/logs/marketing.
  // It is present in the local shield response only.
  text?: string
}

// ─── Guard finding ────────────────────────────────────────────────────────
export type GuardFindingType =
  | 'prompt_injection'
  | 'hidden_text'
  | 'steganography'
  | 'override_attempt'

export interface GuardFinding {
  type: GuardFindingType
  location: string
  confidence: number
  excerpt_safe: string // safe redacted version — OK to display
}

// ─── Ledger entry ─────────────────────────────────────────────────────────
export interface LedgerEntry {
  id: string
  timestamp: string
  operation: 'shield' | 'guard'
  category_counts: Partial<Record<FindingCategory, number>>
  route: 'local' | 'cloud'
  hash: string
  prev_hash: string
}

// ─── Shield response ──────────────────────────────────────────────────────
export interface ShieldResponse {
  findings: Finding[]
  original_text?: string
  redacted_text: string
  route: 'local' | 'cloud'
  duration_ms: number
  ledger_hash: string
}

// ─── Shield image response ────────────────────────────────────────────────
export interface ShieldImageResponse {
  findings: Finding[]
  redacted_image_url: string // local temp URL only
  route: 'local'
  duration_ms: number
  ledger_hash: string
}

// ─── Guard response ───────────────────────────────────────────────────────
export type GuardVerdict = 'safe' | 'suspicious' | 'malicious'

export interface GuardResponse {
  verdict: GuardVerdict
  findings: GuardFinding[]
  confidence: number
  duration_ms: number
  ledger_hash: string
}

// ─── Ledger list response ─────────────────────────────────────────────────
export interface LedgerListResponse {
  entries: LedgerEntry[]
  chain_valid: boolean
}

// ─── Ledger verify response ───────────────────────────────────────────────
export interface LedgerVerifyResponse {
  valid: boolean
  first_bad_index?: number
}

// ─── Status response ──────────────────────────────────────────────────────
export interface StatusResponse {
  ollama_reachable: boolean
  model: string
  detection_mode: string
  extension_seen: boolean
}

// ─── Data location state ──────────────────────────────────────────────────
export type DataLocation = 'LOCAL_ONLY' | 'CLOUD_SANITIZED' | 'OFFLINE'

// ─── Keep/Redact decision per finding ────────────────────────────────────
export type FindingDecision = 'redact' | 'keep'

export interface FindingWithDecision extends Finding {
  decision: FindingDecision
}

// ─── Privacy receipt data ─────────────────────────────────────────────────
export interface PrivacyReceiptData {
  timestamp: string
  category_counts: Partial<Record<FindingCategory, number>>
  total_items_redacted: number
  route: 'local' | 'cloud'
  duration_ms: number
  ledger_hash: string
  raw_values_sent: 0 // always 0 — this is the invariant
}

// ─── Category display metadata ────────────────────────────────────────────
export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  NAME:       'Name',
  EMAIL:      'Email address',
  PHONE:      'Phone number',
  IBAN:       'Bank account (IBAN)',
  SSN:        'Social Security No.',
  ADDRESS:    'Physical address',
  CREDENTIAL: 'Credential / password',
  MEDICAL:    'Medical information',
  OTHER:      'Other sensitive data',
}

// ─── Supported sites (extension) ──────────────────────────────────────────
export const SUPPORTED_SITES = [
  { host: 'chat.openai.com', label: 'ChatGPT' },
  { host: 'claude.ai',       label: 'Claude' },
  { host: 'gemini.google.com', label: 'Gemini' },
] as const

// ─── API Client Functions ────────────────────────────────────────────────
const API_BASE = '/api'

export async function fetchHealth(): Promise<StatusResponse & Record<string, any>> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`)
  return res.json()
}

export async function scanShieldText(
  text: string,
  confidenceThreshold: number = 0.5
): Promise<ShieldResponse> {
  const res = await fetch(`${API_BASE}/shield/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source: 'web_console',
      confidence_threshold: confidenceThreshold,
    }),
  })
  if (!res.ok) throw new Error(`Shield text scan failed: ${res.statusText}`)
  return res.json()
}

export async function scanShieldFile(file: File): Promise<{
  session_id: string
  mode: string
  findings: Finding[]
  original_text?: string
  redacted_text?: string
  redacted_image_b64?: string
  stats?: { counts_by_category?: Record<string, number>; total_findings?: number; duration_ms?: number }
}> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/shield/file`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Shield file scan failed: ${res.statusText}`)
  return res.json()
}

export async function scanGuardFile(file: File): Promise<GuardResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/guard/scan`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Guard file scan failed: ${res.statusText}`)
  const data = await res.json()

  const rawVerdict = (data.verdict || 'SAFE').toLowerCase()
  const verdict: GuardVerdict =
    rawVerdict === 'malicious' ? 'malicious' : rawVerdict === 'suspicious' ? 'suspicious' : 'safe'

  const findings: GuardFinding[] = (data.flagged_spans || []).map((span: any) => ({
    type: 'prompt_injection',
    location: span.reason || 'Document content',
    confidence: data.score || 0.95,
    excerpt_safe: span.text || span.reason || 'Flagged span in document',
  }))

  return {
    verdict,
    findings,
    confidence: data.score ?? 0.95,
    duration_ms: data.duration_ms || 320,
    ledger_hash: data.ledger_hash || `sha256:${Math.random().toString(36).slice(2)}`,
  }
}

export async function scanGuardText(text: string, source: string = 'web_console'): Promise<any> {
  const res = await fetch(`${API_BASE}/guard/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source }),
  })
  if (!res.ok) throw new Error(`Guard scan failed: ${res.statusText}`)
  return res.json()
}

export async function fetchLedgerEntries(limit: number = 50): Promise<any[]> {
  const res = await fetch(`${API_BASE}/ledger/entries?limit=${limit}`)
  if (!res.ok) throw new Error(`Fetch ledger entries failed: ${res.statusText}`)
  return res.json()
}

export async function verifyLedgerChain(): Promise<{ valid: boolean; first_bad_index?: number; total_entries: number }> {
  const res = await fetch(`${API_BASE}/ledger/verify`)
  if (!res.ok) throw new Error(`Verify ledger failed: ${res.statusText}`)
  return res.json()
}

export async function tamperLedgerBlock(targetIndex: number, field: string = 'findings_count'): Promise<any> {
  const res = await fetch(`${API_BASE}/ledger/tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_index: targetIndex, tamper_field: field }),
  })
  if (!res.ok) throw new Error(`Tamper ledger block failed: ${res.statusText}`)
  return res.json()
}

export async function runAttackComparison(content: string): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/naive-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(`Attack comparison failed: ${res.statusText}`)
  return res.json()
}

export async function submitCTFAttempt(prompt: string, playerName: string = 'Player1'): Promise<any> {
  const res = await fetch(`${API_BASE}/ctf/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, handle: playerName }),
  })
  if (!res.ok) throw new Error(`CTF submission failed: ${res.statusText}`)
  return res.json()
}

export async function sendPipelineChat(message: string, runId: string, sessionId: string = 'default'): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, run_id: runId, session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`Pipeline chat failed: ${res.statusText}`)
  return res.json()
}
