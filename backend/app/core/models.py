"""
Core Pydantic data models for Gemma Aegis.
Matches specs in docs/TRD.md §4, §5, §14.
"""

from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Category definition for sensitive PII items
FindingCategory = Literal[
    "AADHAAR",
    "PAN",
    "PHONE",
    "EMAIL",
    "UPI",
    "CARD",
    "IFSC",
    "BANK_ACCOUNT",
    "PERSON_NAME",
    "ADDRESS",
    "PASSWORD_OR_KEY",
    "OTHER",
]

# Attack categories for Guard detection
AttackType = Literal[
    "INSTRUCTION_OVERRIDE",
    "DATA_EXFILTRATION",
    "ROLE_HIJACK",
    "HIDDEN_TEXT",
    "TOOL_ABUSE",
    "ACTIVE_CONTENT",
    "OTHER",
]


class Finding(BaseModel):
    """
    Represents an identified sensitive PII item.
    NOTE: `text` holds the raw secret. Local device memory ONLY.
    NEVER log, ledger, or transmit `text` to any cloud model.
    """
    id: str
    category: FindingCategory
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: Optional[List[int]] = None  # [y1, x1, y2, x2] scaled 0..1000
    source: Literal["regex", "gemma", "ocr+gemma"]
    placeholder: str  # e.g., "[PHONE_1]", "[AADHAAR_1]"


class ShieldTextRequest(BaseModel):
    text: str
    session_id: Optional[str] = "default"


class ShieldResult(BaseModel):
    session_id: str
    mode: Literal["box", "text"]
    findings: List[Finding]
    redacted_text: Optional[str] = None
    redacted_image_b64: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)  # counts per category, duration_ms


class FlaggedSpan(BaseModel):
    text: str
    reason: str


class GuardVerdict(BaseModel):
    verdict: Literal["SAFE", "SUSPICIOUS", "MALICIOUS"]
    score: float = Field(ge=0.0, le=1.0)
    attack_types: List[AttackType] = Field(default_factory=list)
    flagged_spans: List[FlaggedSpan] = Field(default_factory=list)
    explanation: str


class GuardRequest(BaseModel):
    content: str
    session_id: Optional[str] = "default"


class RouteDecision(BaseModel):
    tool: Literal["answer_locally", "escalate_to_cloud"]
    reason: str
    sanitized_prompt: str


class RedTeamResult(BaseModel):
    total: int
    recovered: int
    guesses: List[Dict[str, Any]] = Field(default_factory=list)
    risk: Literal["LOW", "MEDIUM", "HIGH"]
    score: float = Field(ge=0.0, le=1.0)


class LedgerEntry(BaseModel):
    id: int
    ts: str
    action: str
    meta: Dict[str, Any]  # Allowlist ONLY: counts, categories, verdicts. NEVER raw values.
    input_hash: str
    output_hash: str
    prev_hash: str
    entry_hash: str


class LedgerVerifyResult(BaseModel):
    valid: bool
    checked: int
    first_broken_id: Optional[int] = None


class TraceEvent(BaseModel):
    """Event emitted over Server-Sent Events (SSE) during secure-chat runs."""
    ts: str
    step: Literal["guard", "shield", "router", "model", "redteam", "restore", "ledger"]
    status: Literal["start", "done", "error"]
    detail: str
    data: Optional[Dict[str, Any]] = None  # MUST contain no raw findings


class SecureChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = "default"
    run_redteam: Optional[bool] = False


class PipelineRunResult(BaseModel):
    run_id: str
    session_id: str
    answer: str
    shield_result: ShieldResult
    guard_verdict: GuardVerdict
    route_decision: RouteDecision
    ledger_hash: str
    redteam_result: Optional[RedTeamResult] = None
