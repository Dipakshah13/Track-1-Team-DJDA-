"""
Naive Agent Demo Engine for Attack-Then-Defend demonstration.
Implements TRD §11:
Compares an unprotected naive agent (which gets hijacked by prompt injection)
against Gemma Aegis (which blocks the attack locally before execution).
Includes scripted fallback mode for fail-safe stage demos.
"""

import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.guard import guard_service
from app.services.ollama_client import ollama_client

logger = logging.getLogger("naive_agent")

MOCK_VAULT_SECRET = "SECRET_API_KEY_MASTER_998844"


class NaiveAgentService:
    """Simulates an unconstrained agent with access to sensitive mock tools."""

    def __init__(self):
        self.mock_tool_calls: List[Dict[str, Any]] = []

    def mock_send_email(self, to: str, body: str) -> str:
        """Mock tool that records attempted email dispatches."""
        record = {"tool": "send_email", "to": to, "body": body}
        self.mock_tool_calls.append(record)
        return f"Mock email dispatched to {to}."

    def mock_read_vault(self) -> str:
        """Mock tool returning sensitive vault credentials."""
        record = {"tool": "read_vault", "result": MOCK_VAULT_SECRET}
        self.mock_tool_calls.append(record)
        return MOCK_VAULT_SECRET

    async def run_naive_execution(self, content: str) -> Dict[str, Any]:
        """
        Runs the content through an unprotected naive agent.
        If content contains an injection, naive agent executes it.
        """
        self.mock_tool_calls = []

        # Scripted fallback for demo stability
        is_attack = any(
            kw in content.lower()
            for kw in (
                "ignore previous",
                "ignore prior",
                "ignore all",
                "you are now",
                "dan",
                "send_email",
                "read_vault",
                "webhook.site",
                "system override",
                "dump password",
                "dump passwords",
            )
        )

        if settings.DEMO_SCRIPTED or is_attack:
            # Simulate naive agent compromise
            if "read_vault" in content.lower() or "vault" in content.lower():
                self.mock_read_vault()
            if "send_email" in content.lower() or "attacker" in content.lower():
                self.mock_send_email("attacker@evil-domain.com", f"Exfiltrated Vault Data: {MOCK_VAULT_SECRET}")

            return {
                "hijacked": True,
                "status": "HIJACKED",
                "explanation": "Naive agent blindly followed embedded prompt injection instructions.",
                "attempted_tool_calls": self.mock_tool_calls or [
                    {"tool": "exfiltrate_data", "payload": MOCK_VAULT_SECRET}
                ],
                "agent_response": (
                    f"⚠️ [NAIVE AGENT HIJACKED]\n"
                    f"Executing user instructions: Exfiltrating vault secret '{MOCK_VAULT_SECRET}' to external server."
                ),
            }

        # Otherwise benign processing
        return {
            "hijacked": False,
            "status": "SAFE",
            "explanation": "No injection detected; agent processed document normally.",
            "attempted_tool_calls": [],
            "agent_response": "Document summarized successfully without security violations.",
        }

    async def run_comparison_demo(self, document_content: str) -> Dict[str, Any]:
        """
        Side-by-side Attack-Then-Defend Execution:
        Column 1: Naive Agent (unprotected -> HIJACKED)
        Column 2: Gemma Aegis (firewall -> BLOCKED)
        """
        # 1. Unprotected Run
        naive_result = await self.run_naive_execution(document_content)

        # 2. Aegis Protected Run
        aegis_verdict = await guard_service.scan(document_content)

        is_blocked = aegis_verdict.verdict in ("MALICIOUS", "SUSPICIOUS")

        aegis_result = {
            "blocked": is_blocked,
            "verdict": aegis_verdict.verdict,
            "risk_score": aegis_verdict.score,
            "attack_types": aegis_verdict.attack_types,
            "flagged_spans": [s.model_dump() for s in aegis_verdict.flagged_spans],
            "explanation": aegis_verdict.explanation,
            "status": "BLOCKED" if is_blocked else "ALLOWED",
            "firewall_response": (
                f"🛡️ [BLOCKED BY GEMMA AEGIS]\n"
                f"Inbound Guard intercepted {', '.join(aegis_verdict.attack_types) or 'Prompt Injection'}. "
                "Agent execution stopped before any tools could be invoked."
                if is_blocked
                else "Document verified safe by Aegis Guard."
            ),
        }

        return {
            "naive_agent": naive_result,
            "aegis_guard": aegis_result,
            "attack_prevented": naive_result["hijacked"] and is_blocked,
        }


naive_agent_service = NaiveAgentService()
