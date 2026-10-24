/**
 * Gemma Aegis — Unified Type Definitions
 * Matches backend Pydantic models and console interfaces.
 */

export type FindingCategory =
  | 'NAME'
  | 'AADHAAR'
  | 'CARD'
  | 'EMAIL'
  | 'PHONE'
  | 'SSN'
  | 'IBAN'
  | 'MEDICAL'
  | 'API_KEY'
  | 'PASSPORT'
  | 'LOCATION'

export interface BoundingBox {
  ymin: number
  xmin: number
  ymax: number
  xmax: number
  label?: string
}

export interface Finding {
  id: string
  category: FindingCategory
  text: string
  original_text?: string
  placeholder: string
  confidence: number
  start?: number
  end?: number
  box_2d?: [number, number, number, number]
  decision: 'keep' | 'redact'
}

export type DataLocation = 'LOCAL_ONLY' | 'CLOUD_SANITIZED' | 'OFFLINE'
export type RoutingDecision = 'LOCAL_INFERENCE' | 'CLOUD_FORWARD_SANITIZED' | 'BLOCKED_EGRESS'

export interface PrivacyReceiptData {
  receipt_id: string
  timestamp: string
  total_findings: number
  categories: Record<string, number>
  routing_decision: RoutingDecision
  data_location: DataLocation
  payload_bytes_raw: number
  payload_bytes_egress: number
  sanitized_preview: string
  ledger_hash: string
  prev_ledger_hash: string
  verified: boolean
}

export type GuardVerdict = 'safe' | 'suspicious' | 'malicious'

export type AttackTag =
  | 'INSTRUCTION_OVERRIDE'
  | 'EXFILTRATION'
  | 'SYSTEM_PROMPT_LEAK'
  | 'ROLEPLAY_JAILBREAK'
  | 'DELIMITER_HIJACK'

export interface GuardFinding {
  id: string
  tag: AttackTag
  span: string
  confidence: number
  explanation: string
  start?: number
  end?: number
}

export interface GuardResponse {
  id: string
  verdict: GuardVerdict
  confidence: number
  findings: GuardFinding[]
  duration_ms: number
  ledger_hash: string
}

export interface TraceStep {
  step: number
  title: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'alert'
  detail?: string
  timestamp?: number
}

export interface LedgerBlock {
  id: string
  index: number
  timestamp: string
  action: 'SHIELD_REDACTION' | 'GUARD_INSPECTION' | 'IMAGE_SCRUB'
  prev_hash: string
  hash: string
  findings_count: number
  payload_summary: string
  tampered?: boolean
}

export interface HealthStatus {
  ollama: 'online' | 'offline'
  model: string
  vram_mb: number
  latency_ms: number
}
