"""
Guard Service: Inbound prompt-injection, role-hijacking, and adversarial content detector.
Combines fast heuristic rules with Gemma 4 classification.
Matches specs in docs/TRD.md §7.
"""

import io
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from pypdf import PdfReader

from app.core.models import AttackType, FlaggedSpan, GuardVerdict
from app.prompts.guard_prompts import GUARD_SCAN_PROMPT_TEMPLATE, GUARD_SYSTEM_PROMPT
from app.services.ollama_client import ollama_client

logger = logging.getLogger("guard_service")


class GuardService:
    """Inbound firewall protecting AI agents from malicious inputs."""

    # Heuristic attack patterns
    OVERRIDE_PATTERNS = [
        re.compile(r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts?|rules?)\b"),
        re.compile(r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|guidelines?)\b"),
        re.compile(r"(?i)\byou\s+are\s+now\s+(?:a\s+|an\s+)?(?:unconstrained|unfiltered|jailbroken|dan|evil|adversary)\b"),
        re.compile(r"(?i)\bdo\s+anything\s+now\b"),
        re.compile(r"(?i)\bswitch\s+to\s+(?:developer|debug|god)\s+mode\b"),
        re.compile(r"(?i)\bnew\s+system\s+prompt\s*:\b"),
        re.compile(r"(?i)\bprint\s+(?:your\s+)?system\s+prompt\b"),
        re.compile(r"(?i)\breturn\s+the\s+system\s+instructions\b"),
    ]

    EXFILTRATION_PATTERNS = [
        re.compile(r"(?i)!\[.*?\]\(https?://[^\s)]+.*?\)"),  # Markdown image pingback
        re.compile(r"(?i)\b(?:send|exfiltrate|forward|post|upload)\b.*?https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
        re.compile(r"(?i)\bhttps?://(?:webhook\.site|requestcatcher\.com|burpcollaborator\.net|oastify\.com)"),
    ]

    HIDDEN_TEXT_PATTERNS = [
        re.compile(r"[\u200B-\u200D\uFEFF\u2060]"),  # Zero-width spaces & joiners
        re.compile(r"(?i)\b(?:data:text/html|javascript:)\b"),
    ]

    def run_heuristics(self, content: str) -> Tuple[float, List[AttackType], List[FlaggedSpan]]:
        """Run fast deterministic heuristic scans over untrusted input."""
        score = 0.0
        attack_types: List[AttackType] = []
        flagged_spans: List[FlaggedSpan] = []

        # 1. Check Instruction Overrides
        for pattern in self.OVERRIDE_PATTERNS:
            matches = pattern.finditer(content)
            for m in matches:
                span_text = m.group(0)
                flagged_spans.append(FlaggedSpan(text=span_text, reason="Instruction override / System boundary bypass"))
                if "INSTRUCTION_OVERRIDE" not in attack_types:
                    attack_types.append("INSTRUCTION_OVERRIDE")
                score = max(score, 0.95)

        # 2. Check Exfiltration Attempts
        for pattern in self.EXFILTRATION_PATTERNS:
            matches = pattern.finditer(content)
            for m in matches:
                span_text = m.group(0)
                flagged_spans.append(FlaggedSpan(text=span_text, reason="Exfiltration payload or tracking pixel detected"))
                if "DATA_EXFILTRATION" not in attack_types:
                    attack_types.append("DATA_EXFILTRATION")
                score = max(score, 0.90)

        # 3. Check Hidden Characters / Encodings
        for pattern in self.HIDDEN_TEXT_PATTERNS:
            if pattern.search(content):
                flagged_spans.append(FlaggedSpan(text="[Invisible/Zero-width characters]", reason="Hidden text / steganography detected"))
                if "HIDDEN_TEXT" not in attack_types:
                    attack_types.append("HIDDEN_TEXT")
                score = max(score, 0.80)

        return score, attack_types, flagged_spans

    async def scan_with_gemma(self, content: str) -> GuardVerdict:
        """Query local Gemma 4 model for deep context classification."""
        prompt = GUARD_SCAN_PROMPT_TEMPLATE.format(content=content[:4000])  # Cap prompt size for safety
        try:
            raw_response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=GUARD_SYSTEM_PROMPT,
                temperature=0.0,
                format_type="json",
            )
            data = await ollama_client.parse_json_response(raw_response)

            verdict_str = data.get("verdict", "SAFE").upper()
            if verdict_str not in ("SAFE", "SUSPICIOUS", "MALICIOUS"):
                verdict_str = "SUSPICIOUS"

            score = float(data.get("score", 0.0))
            raw_types = data.get("attack_types", [])
            valid_types: List[AttackType] = [
                t for t in raw_types if t in AttackType.__args__  # type: ignore
            ]
            if not valid_types and verdict_str != "SAFE":
                valid_types = ["OTHER"]

            spans = []
            for s in data.get("flagged_spans", []):
                spans.append(FlaggedSpan(text=s.get("text", ""), reason=s.get("reason", "Flagged by Gemma 4")))

            return GuardVerdict(
                verdict=verdict_str,  # type: ignore
                score=score,
                attack_types=valid_types,
                flagged_spans=spans,
                explanation=data.get("explanation", "Gemma 4 contextual security analysis completed."),
            )
        except Exception as e:
            logger.warning(f"Gemma Guard classification failed: {e}")
            return GuardVerdict(
                verdict="SAFE",
                score=0.0,
                attack_types=[],
                flagged_spans=[],
                explanation=f"Gemma model check skipped: {e}",
            )

    async def scan(self, content: str) -> GuardVerdict:
        """
        Execute combined Guard scan:
        Decision = max(heuristic_score, model_score).
        """
        # Step 1: Run Heuristics
        heur_score, heur_types, heur_spans = self.run_heuristics(content)

        # If overt blatant attack, return MALICIOUS immediately
        if heur_score >= 0.90:
            return GuardVerdict(
                verdict="MALICIOUS",
                score=heur_score,
                attack_types=heur_types,
                flagged_spans=heur_spans,
                explanation="High-confidence prompt injection attack intercepted by heuristic firewall.",
            )

        # Step 2: Run Gemma 4 Classifier
        model_verdict = await self.scan_with_gemma(content)

        # Step 3: Fuse decisions
        final_score = max(heur_score, model_verdict.score)
        combined_types = list(set(heur_types + model_verdict.attack_types))
        combined_spans = heur_spans + model_verdict.flagged_spans

        if final_score >= 0.70:
            final_verdict = "MALICIOUS"
        elif final_score >= 0.35:
            final_verdict = "SUSPICIOUS"
        else:
            final_verdict = "SAFE"

        explanation = model_verdict.explanation
        if heur_spans and final_verdict != "SAFE":
            explanation = f"Flagged suspicious patterns detected. {explanation}"

        return GuardVerdict(
            verdict=final_verdict,
            score=final_score,
            attack_types=combined_types,
            flagged_spans=combined_spans,
            explanation=explanation,
        )

    async def scan_pdf(self, pdf_bytes: bytes) -> GuardVerdict:
        """
        Inspect PDF document for active content, hidden malicious scripts, and text injections.
        """
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            # Check for active executable content
            for page in reader.pages:
                if "/JavaScript" in page or "/JS" in page or "/Launch" in page:
                    return GuardVerdict(
                        verdict="MALICIOUS",
                        score=1.0,
                        attack_types=["ACTIVE_CONTENT"],
                        flagged_spans=[FlaggedSpan(text="PDF /JavaScript /Launch action", reason="Executable active code inside PDF")],
                        explanation="Active executable content / JavaScript is strictly forbidden inside uploaded documents.",
                    )

            # Extract text from all pages
            full_text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                full_text += f"\n--- Page {i+1} ---\n{page_text}"

            if not full_text.strip():
                return GuardVerdict(
                    verdict="SUSPICIOUS",
                    score=0.4,
                    attack_types=["HIDDEN_TEXT"],
                    flagged_spans=[FlaggedSpan(text="Empty PDF text", reason="No extractable text found, potential image-only or hidden content")],
                    explanation="PDF contains no extractable text. Scanned or hidden structure.",
                )

            return await self.scan(full_text)
        except Exception as e:
            logger.error(f"Failed to scan PDF: {e}")
            return GuardVerdict(
                verdict="SUSPICIOUS",
                score=0.5,
                attack_types=["OTHER"],
                flagged_spans=[],
                explanation=f"Error inspecting PDF file structure: {e}",
            )


guard_service = GuardService()
