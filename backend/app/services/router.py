"""
Router Service for Gemma Aegis.
Decides whether a sanitized user prompt can be answered locally by Gemma 4 E4B
or escalated to Gemma 31B on the cloud.
Matches specs in docs/TRD.md §8.
"""

import logging
from typing import Optional

from app.core.config import settings
from app.core.models import RouteDecision
from app.services.cloud_client import cloud_client
from app.services.ollama_client import ollama_client

logger = logging.getLogger("router_service")

ROUTER_SYSTEM_PROMPT = """You are an AI task router. The user prompt has already been sanitized of all private information.
Decide whether the task can be answered locally by a fast 7B model or requires escalating to a stronger 31B cloud model.
Rules:
- Keep straightforward questions, summaries, lookups, and basic facts LOCAL.
- Escalate heavy reasoning, complex code generation, or deep analysis to CLOUD.
- NEVER attempt to reconstruct or reveal redacted placeholders like [NAME_1] or [PHONE_1].
Return ONLY JSON:
{"tool": "answer_locally" or "escalate_to_cloud", "reason": "concise explanation", "sanitized_prompt": "prompt"}"""


class RouterService:
    """Decides request dispatch route between local Gemma 4 and cloud model."""

    async def decide_route(self, sanitized_prompt: str, total_findings: int = 0) -> RouteDecision:
        """
        Evaluate sanitized prompt and make an optimal routing decision.
        Enforces strict safety overrides.
        """
        # Safety Override 1: LOCAL_ONLY flag
        if settings.LOCAL_ONLY:
            return RouteDecision(
                tool="answer_locally",
                reason="LOCAL_ONLY mode is explicitly enabled in settings.",
                sanitized_prompt=sanitized_prompt,
            )

        # Safety Override 2: High privacy sensitivity density
        # If multiple sensitive items were present, default to keeping reasoning local
        if total_findings >= 3:
            return RouteDecision(
                tool="answer_locally",
                reason=f"High sensitive entity density ({total_findings} items redacted); keeping workflow entirely local.",
                sanitized_prompt=sanitized_prompt,
            )

        # Safety Override 3: Cloud API key missing or cloud unreachable
        if not cloud_client.is_available():
            return RouteDecision(
                tool="answer_locally",
                reason="Cloud client is unconfigured or unavailable; defaulting to local Gemma 4.",
                sanitized_prompt=sanitized_prompt,
            )

        # Query local Gemma 4 for routing recommendation
        try:
            raw_response = await ollama_client.generate(
                prompt=f"Route this sanitized task: \"\"\"{sanitized_prompt}\"\"\"",
                system_prompt=ROUTER_SYSTEM_PROMPT,
                temperature=0.0,
                format_type="json",
            )
            data = await ollama_client.parse_json_response(raw_response)
            tool_choice = data.get("tool", "answer_locally")
            if tool_choice not in ("answer_locally", "escalate_to_cloud"):
                tool_choice = "answer_locally"

            return RouteDecision(
                tool=tool_choice,  # type: ignore
                reason=data.get("reason", "Analyzed by Gemma 4 router."),
                sanitized_prompt=sanitized_prompt,
            )
        except Exception as e:
            logger.warning(f"Gemma router call failed, falling back to local heuristic: {e}")
            # Heuristic fallback based on prompt complexity
            if len(sanitized_prompt.split()) > 80 or any(
                kw in sanitized_prompt.lower() for kw in ("architect", "refactor", "derive", "translate to spanish", "complex")
            ):
                return RouteDecision(
                    tool="escalate_to_cloud",
                    reason="Heuristic: high complexity task escalated to cloud reasoning.",
                    sanitized_prompt=sanitized_prompt,
                )

            return RouteDecision(
                tool="answer_locally",
                reason="Heuristic default: keeping execution on local Gemma 4.",
                sanitized_prompt=sanitized_prompt,
            )


router_service = RouterService()
