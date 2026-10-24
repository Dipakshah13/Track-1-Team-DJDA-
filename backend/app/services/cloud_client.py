"""
Cloud client for Gemma Aegis using the Gemini API / Gemma 31B.
Enforces the mandatory local privacy boundary (Hard Rule 1 from AGENTS.md).
"""

import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.models import Finding

logger = logging.getLogger("cloud_client")


class PrivacyBoundaryViolation(Exception):
    """Raised when an outbound payload contains raw unredacted sensitive data."""
    pass


def assert_no_raw_findings(payload_text: str, findings: List[Finding]) -> None:
    """
    MANDATORY PRIVACY GATE:
    Ensures that not a single raw secret from the session findings
    is present in the text destined for the cloud model.
    """
    for finding in findings:
        raw_val = finding.text.strip()
        # Avoid checking trivial single-character spans
        if len(raw_val) >= 3 and raw_val.lower() in payload_text.lower():
            raise PrivacyBoundaryViolation(
                f"Privacy boundary violation! Detected raw {finding.category} in outbound payload. "
                "Transmission blocked locally."
            )


class CloudClient:
    """Interface to cloud model (Gemma 31B on Gemini API)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.CLOUD_MODEL
        self._client = None
        if self.api_key and not settings.LOCAL_ONLY:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}")

    def is_available(self) -> bool:
        """Check if cloud reasoning is enabled and configured."""
        if settings.LOCAL_ONLY or not self.api_key:
            return False
        return self._client is not None

    async def generate(self, sanitized_prompt: str, known_findings: Optional[List[Finding]] = None) -> str:
        """
        Send a sanitized prompt to the cloud model.
        Guarantees that raw secrets are never transmitted.
        """
        if settings.LOCAL_ONLY:
            raise RuntimeError("LOCAL_ONLY is enabled. Cloud calls are strictly disallowed.")

        if not self.is_available():
            raise RuntimeError("Cloud model is not configured. Provide GEMINI_API_KEY or use LOCAL_ONLY=true.")

        # Hard privacy gate check
        if known_findings:
            assert_no_raw_findings(sanitized_prompt, known_findings)

        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=sanitized_prompt,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Cloud generation failed: {e}")
            raise


cloud_client = CloudClient()
