"""
Secure Chat Pipeline Orchestrator for Gemma Aegis.
Implements the complete end-to-end two-way AI firewall flow:
Guard (Inbound) -> Shield (Outbound) -> Router -> Model Inference -> Restore -> Ledger.
Emits live TraceEvents via SSE for real-time console tracing.
"""

import logging
import time
import uuid
from typing import Dict, Optional

from app.core.events import event_bus
from app.core.models import (
    GuardVerdict,
    PipelineRunResult,
    RouteDecision,
    ShieldResult,
)
from app.services.cloud_client import cloud_client
from app.services.guard import guard_service
from app.services.ledger import ledger_service
from app.services.ollama_client import ollama_client
from app.services.router import router_service
from app.services.shield import shield_service

logger = logging.getLogger("pipeline_service")


class PipelineService:
    """Orchestrates secure AI interactions, enforcing privacy and security gates."""

    def __init__(self):
        # run_id -> PipelineRunResult cache
        self._runs: Dict[str, PipelineRunResult] = {}

    def get_run(self, run_id: str) -> Optional[PipelineRunResult]:
        """Fetch final run result by run_id."""
        return self._runs.get(run_id)

    async def execute_secure_chat(
        self,
        prompt: str,
        session_id: str = "default",
        run_id: Optional[str] = None,
    ) -> PipelineRunResult:
        """
        Execute full firewall workflow with SSE event streaming:
        1. Guard Inbound Scan
        2. Shield Outbound PII Redaction
        3. Local vs Cloud Route Decision
        4. Model Inference (Local Gemma 4 or Sanitized Cloud 31B)
        5. Reversible De-anonymization / Restore
        6. Cryptographic Ledger Entry
        """
        active_run_id = run_id or f"run_{uuid.uuid4().hex[:10]}"
        start_time = time.perf_counter()

        # -------------------------------------------------------------
        # STEP 1: Guard Inbound Scan
        # -------------------------------------------------------------
        await event_bus.emit(
            active_run_id,
            step="guard",
            status="start",
            detail="Scanning input for prompt injection, adversarial payloads, and active content...",
        )

        guard_verdict: GuardVerdict = await guard_service.scan(prompt)

        if guard_verdict.verdict == "MALICIOUS":
            await event_bus.emit(
                active_run_id,
                step="guard",
                status="error",
                detail=f"SECURITY ALERT: Intercepted malicious attack ({', '.join(guard_verdict.attack_types)}). Execution halted.",
                data={
                    "verdict": guard_verdict.verdict,
                    "score": guard_verdict.score,
                    "attack_types": guard_verdict.attack_types,
                },
            )

            # Record security block in ledger
            blocked_entry = ledger_service.append_entry(
                action="GUARD_BLOCKED",
                meta={
                    "verdict": "MALICIOUS",
                    "risk_score": guard_verdict.score,
                    "attack_types": guard_verdict.attack_types,
                    "session_id": session_id,
                    "status": "BLOCKED",
                },
                input_data=prompt,
                output_data="[INTERCEPTED_BY_GEMMA_AEGIS]",
            )

            blocked_result = PipelineRunResult(
                run_id=active_run_id,
                session_id=session_id,
                answer=(
                    "🛡️ [BLOCKED BY GEMMA AEGIS]\n"
                    "Your prompt was flagged as an adversarial attack or instruction override "
                    f"({guard_verdict.explanation}). Request terminated locally."
                ),
                shield_result=ShieldResult(
                    session_id=session_id,
                    mode="text",
                    findings=[],
                    redacted_text=None,
                    redacted_image_b64=None,
                    stats={"status": "SKIPPED_DUE_TO_ATTACK"},
                ),
                guard_verdict=guard_verdict,
                route_decision=RouteDecision(
                    tool="answer_locally",
                    reason="Execution stopped by Guard firewall.",
                    sanitized_prompt="[BLOCKED]",
                ),
                ledger_hash=blocked_entry.entry_hash,
            )
            self._runs[active_run_id] = blocked_result
            return blocked_result

        await event_bus.emit(
            active_run_id,
            step="guard",
            status="done",
            detail=f"Inbound scan passed: Verdict {guard_verdict.verdict} (Risk score: {guard_verdict.score:.2f})",
            data={
                "verdict": guard_verdict.verdict,
                "score": guard_verdict.score,
            },
        )

        # -------------------------------------------------------------
        # STEP 2: Shield Outbound PII Redaction
        # -------------------------------------------------------------
        await event_bus.emit(
            active_run_id,
            step="shield",
            status="start",
            detail="Scanning for sensitive data (Aadhaar, PAN, phones, emails, names, cards)...",
        )

        shield_result: ShieldResult = await shield_service.redact_text(prompt, session_id=session_id)
        sanitized_prompt = shield_result.redacted_text or prompt
        findings_count = len(shield_result.findings)

        await event_bus.emit(
            active_run_id,
            step="shield",
            status="done",
            detail=f"Outbound shield complete: Redacted {findings_count} sensitive entities.",
            data={
                "total_findings": findings_count,
                "counts_by_category": shield_result.stats.get("counts_by_category", {}),
            },
        )

        # -------------------------------------------------------------
        # STEP 3: Route Decision
        # -------------------------------------------------------------
        await event_bus.emit(
            active_run_id,
            step="router",
            status="start",
            detail="Analyzing sanitized prompt to decide local vs cloud routing...",
        )

        route_decision: RouteDecision = await router_service.decide_route(
            sanitized_prompt=sanitized_prompt,
            total_findings=findings_count,
        )

        await event_bus.emit(
            active_run_id,
            step="router",
            status="done",
            detail=f"Routing decision: {route_decision.tool} ({route_decision.reason})",
            data={
                "tool": route_decision.tool,
                "reason": route_decision.reason,
            },
        )

        # -------------------------------------------------------------
        # STEP 4: Model Inference
        # -------------------------------------------------------------
        model_name = "gemma4:e4b (local)"
        await event_bus.emit(
            active_run_id,
            step="model",
            status="start",
            detail=f"Generating response using {route_decision.tool}...",
        )

        raw_answer = ""
        if route_decision.tool == "escalate_to_cloud" and cloud_client.is_available():
            try:
                model_name = "gemma-4-31b-it (cloud)"
                # Strictly verified: known_findings checked to ensure NO raw secret leaks
                raw_answer = await cloud_client.generate(
                    sanitized_prompt=sanitized_prompt,
                    known_findings=shield_result.findings,
                )
            except Exception as e:
                logger.warning(f"Cloud generation failed; falling back to local Gemma 4: {e}")
                model_name = "gemma4:e4b (local fallback)"
                raw_answer = await ollama_client.generate(
                    prompt=sanitized_prompt,
                    format_type=None,
                )
        else:
            model_name = "gemma4:e4b (local)"
            raw_answer = await ollama_client.generate(
                prompt=sanitized_prompt,
                format_type=None,
            )

        await event_bus.emit(
            active_run_id,
            step="model",
            status="done",
            detail=f"Response generated successfully by {model_name}.",
            data={"model": model_name},
        )

        # -------------------------------------------------------------
        # STEP 5: Reversible De-anonymization / Restore
        # -------------------------------------------------------------
        await event_bus.emit(
            active_run_id,
            step="restore",
            status="start",
            detail="Locally restoring pseudonym placeholders in response...",
        )

        final_answer = shield_service.restore_text(raw_answer, session_id=session_id)

        await event_bus.emit(
            active_run_id,
            step="restore",
            status="done",
            detail="Pseudonyms restored safely on local device.",
        )

        # -------------------------------------------------------------
        # STEP 6: Cryptographic Hash-Chain Ledger Entry
        # -------------------------------------------------------------
        await event_bus.emit(
            active_run_id,
            step="ledger",
            status="start",
            detail="Generating tamper-evident Privacy Receipt and hashing into audit chain...",
        )

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        ledger_entry = ledger_service.append_entry(
            action="SECURE_CHAT",
            meta={
                "verdict": guard_verdict.verdict,
                "risk_score": guard_verdict.score,
                "total_findings": findings_count,
                "counts_by_category": shield_result.stats.get("counts_by_category", {}),
                "route": route_decision.tool,
                "model_used": model_name,
                "duration_ms": duration_ms,
                "session_id": session_id,
                "status": "COMPLETED",
            },
            input_data=sanitized_prompt,
            output_data=final_answer,
        )

        await event_bus.emit(
            active_run_id,
            step="ledger",
            status="done",
            detail=f"Privacy Receipt created. Block #{ledger_entry.id} hash: {ledger_entry.entry_hash[:16]}...",
            data={
                "block_id": ledger_entry.id,
                "entry_hash": ledger_entry.entry_hash,
                "duration_ms": duration_ms,
            },
        )

        # Cache result
        run_result = PipelineRunResult(
            run_id=active_run_id,
            session_id=session_id,
            answer=final_answer,
            shield_result=shield_result,
            guard_verdict=guard_verdict,
            route_decision=route_decision,
            ledger_hash=ledger_entry.entry_hash,
        )
        self._runs[active_run_id] = run_result
        return run_result


pipeline_service = PipelineService()
