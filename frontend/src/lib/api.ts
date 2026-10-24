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
