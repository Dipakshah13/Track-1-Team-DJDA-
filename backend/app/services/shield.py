"""
Shield Service: Hybrid PII and sensitive data redaction engine.
Combines deterministic regex detection with contextual Gemma 4 intelligence.
Supports both text and image (multimodal box_2d and OCR) redaction.
"""

import base64
import io
import logging
import re
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter

from app.core.config import settings
from app.core.models import Finding, FindingCategory, ShieldResult
from app.prompts.shield_prompts import (
    SHIELD_IMAGE_PROMPT,
    SHIELD_SYSTEM_PROMPT,
    SHIELD_TEXT_PROMPT_TEMPLATE,
)
from app.services.ollama_client import ollama_client

logger = logging.getLogger("shield_service")


# Luhn algorithm for credit/debit card validation
def luhn_checksum(card_number: str) -> bool:
    digits = [int(d) for d in re.sub(r"\D", "", card_number)]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for i, digit in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = digit * 2
            checksum += doubled - 9 if doubled > 9 else doubled
        else:
            checksum += digit
    return checksum % 10 == 0


class ShieldService:
    """Hybrid PII Redactor for outbound privacy preservation."""

    # In-memory session store for reversible pseudonym mappings
    # session_id -> {placeholder: original_text}
    _session_maps: Dict[str, Dict[str, str]] = {}

    # Compiled deterministic regex patterns
    REGEX_PATTERNS = [
        # PAN Card (Indian Permanent Account Number): 5 letters, 4 digits, 1 letter
        (
            "PAN",
            re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),
            0.99,
        ),
        # Aadhaar: 12 digits, often with space or hyphen separators
        (
            "AADHAAR",
            re.compile(r"\b[2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b"),
            0.98,
        ),
        # Email Addresses
        (
            "EMAIL",
            re.compile(r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b"),
            0.99,
        ),
        # UPI IDs (e.g., username@okhdfcbank, user@upi, user@paytm)
        (
            "UPI",
            re.compile(r"\b[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}\b"),
            0.95,
        ),
        # Indian Mobile Numbers (starts with 6-9, optional +91 prefix)
        (
            "PHONE",
            re.compile(r"(?:\+91[\s-]?)?[6-9]\d{9}\b"),
            0.96,
        ),
        # IFSC Code (Indian Financial System Code)
        (
            "IFSC",
            re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b"),
            0.98,
        ),
        # Bank Account Number (explicit keywords followed by 9-18 digits)
        (
            "BANK_ACCOUNT",
            re.compile(r"(?i)\b(?:a/c|account\s*(?:no\.?|number)?)\s*[:#-]?\s*([0-9]{9,18})\b"),
            0.95,
        ),
        # Credit / Debit Cards (candidates checked by Luhn algorithm)
        (
            "CARD",
            re.compile(r"\b(?:\d{4}[\s-]?){3}\d{4}\b|\b\d{13,19}\b"),
            0.99,
        ),
    ]

    @classmethod
    def get_session_map(cls, session_id: str) -> Dict[str, str]:
        """Retrieve reversible mapping for a session."""
        return cls._session_maps.setdefault(session_id, {})

    @classmethod
    def restore_text(cls, redacted_text: str, session_id: str) -> str:
        """De-anonymize / restore original values from local session memory."""
        mapping = cls.get_session_map(session_id)
        restored = redacted_text
        for placeholder, original in mapping.items():
            restored = restored.replace(placeholder, original)
        return restored

    def extract_regex_findings(self, text: str) -> List[Tuple[Finding, int, int]]:
        """Run high-speed deterministic regex layer on text."""
        findings_with_spans: List[Tuple[Finding, int, int]] = []

        for category, pattern, base_confidence in self.REGEX_PATTERNS:
            for match in pattern.finditer(text):
                match_text = match.group(0).strip()
                start, end = match.start(), match.end()

                # Card validation via Luhn check
                if category == "CARD":
                    if not luhn_checksum(match_text):
                        continue

                # Bank account capture group adjustment
                if category == "BANK_ACCOUNT" and match.lastindex:
                    match_text = match.group(1).strip()
                    start, end = match.start(1), match.end(1)

                # Skip trivial matches
                if len(match_text) < 3:
                    continue

                finding = Finding(
                    id=f"fnd_{uuid.uuid4().hex[:8]}",
                    category=category,  # type: ignore
                    text=match_text,
                    confidence=base_confidence,
                    bbox=None,
                    source="regex",
                    placeholder="",  # Assigned during merge
                )
                findings_with_spans.append((finding, start, end))

        return findings_with_spans

    async def extract_gemma_findings(self, text: str) -> List[Tuple[Finding, int, int]]:
        """Query local Gemma 4 model for contextual PII (names, addresses, secrets)."""
        prompt = SHIELD_TEXT_PROMPT_TEMPLATE.format(text=text)
        try:
            raw_response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=SHIELD_SYSTEM_PROMPT,
                temperature=0.0,
                format_type="json",
            )
            data = await ollama_client.parse_json_response(raw_response)
            items = data.get("findings", [])

            findings_with_spans = []
            for item in items:
                category = item.get("category", "OTHER").upper()
                val_text = item.get("text", "").strip()
                confidence = float(item.get("confidence", 0.85))

                if not val_text or len(val_text) < 2:
                    continue

                # Locate occurrence in original text
                start = text.find(val_text)
                if start != -1:
                    end = start + len(val_text)
                    finding = Finding(
                        id=f"fnd_{uuid.uuid4().hex[:8]}",
                        category=category if category in FindingCategory.__args__ else "OTHER",  # type: ignore
                        text=val_text,
                        confidence=confidence,
                        bbox=None,
                        source="gemma",
                        placeholder="",
                    )
                    findings_with_spans.append((finding, start, end))
            return findings_with_spans
        except Exception as e:
            logger.warning(f"Gemma contextual PII extraction skipped: {e}")
            return []

    async def redact_text(self, text: str, session_id: str = "default") -> ShieldResult:
        """
        Execute full Shield Text Pipeline:
        Regex -> Gemma -> Merge & Dedupe -> Replace with Placeholders -> ShieldResult.
        """
        start_time = time.perf_counter()

        # Step 1: Deterministic regex layer
        regex_spans = self.extract_regex_findings(text)

        # Step 2: Contextual Gemma 4 layer
        gemma_spans = await self.extract_gemma_findings(text)

        # Step 3: Merge without span collisions
        # Sort by start offset ascending, then longest span descending
        all_spans = sorted(regex_spans + gemma_spans, key=lambda s: (s[1], -(s[2] - s[1])))

        merged: List[Tuple[Finding, int, int]] = []
        last_end = -1
        for finding, start, end in all_spans:
            if start >= last_end:
                merged.append((finding, start, end))
                last_end = end
            else:
                # Overlap: keep the one with higher confidence
                prev_finding, p_start, p_end = merged[-1]
                if finding.confidence > prev_finding.confidence and (end - start) >= (p_end - p_start):
                    merged[-1] = (finding, start, end)
                    last_end = end

        # Step 4: Assign typed placeholders and replace text
        session_map = self.get_session_map(session_id)
        category_counts: Dict[str, int] = {}
        final_findings: List[Finding] = []

        # Sort in reverse order of start offset so replacements don't shift earlier indices
        sorted_for_replacement = sorted(merged, key=lambda s: s[1], reverse=True)
        redacted = text

        # Assign placeholders first
        for finding, start, end in sorted(merged, key=lambda s: s[1]):
            cat = finding.category
            category_counts[cat] = category_counts.get(cat, 0) + 1
            placeholder = f"[{cat}_{category_counts[cat]}]"
            finding.placeholder = placeholder
            session_map[placeholder] = finding.text
            final_findings.append(finding)

        # Apply replacements
        for finding, start, end in sorted_for_replacement:
            redacted = redacted[:start] + finding.placeholder + redacted[end:]

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        return ShieldResult(
            session_id=session_id,
            mode="text",
            findings=final_findings,
            original_text=text,
            redacted_text=redacted,
            redacted_image_b64=None,
            stats={
                "counts_by_category": category_counts,
                "total_findings": len(final_findings),
                "duration_ms": duration_ms,
            },
        )

    async def redact_image(
        self,
        image_bytes: bytes,
        session_id: str = "default",
        mode: str = "auto",
    ) -> ShieldResult:
        """
        Execute Shield Image Redaction:
        1. Downscales image to max 1600px.
        2. Mode A (Gemma Vision box_2d) -> extracts boxes.
        3. Mode B (RapidOCR fallback) -> extracts word boxes.
        4. Applies Gaussian blur / black boxes over detected regions.
        """
        start_time = time.perf_counter()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        orig_w, orig_h = img.size

        # Downscale to max 1600px if needed
        max_dim = 1600
        if orig_w > max_dim or orig_h > max_dim:
            scale = max_dim / max(orig_w, orig_h)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        else:
            new_w, new_h = orig_w, orig_h

        findings: List[Finding] = []
        bboxes_to_blur: List[Tuple[int, int, int, int]] = []  # (x1, y1, x2, y2) in pixels

        # Attempt Mode A: Gemma Vision Box Mode
        if mode in ("auto", "box"):
            try:
                # Prepare image bytes for Gemma
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=85)
                gemma_img_bytes = buf.getvalue()

                raw_response = await ollama_client.chat_with_image(
                    prompt=SHIELD_IMAGE_PROMPT,
                    image_bytes=gemma_img_bytes,
                    temperature=0.0,
                    format_type="json",
                )
                data = await ollama_client.parse_json_response(raw_response)
                box_findings = data.get("findings", [])

                for item in box_findings:
                    box = item.get("box_2d")  # [ymin, xmin, ymax, xmax] scaled 0..1000
                    if box and len(box) == 4:
                        ymin, xmin, ymax, xmax = box
                        # Validate coordinates
                        if 0 <= ymin < ymax <= 1000 and 0 <= xmin < xmax <= 1000:
                            x1 = int((xmin / 1000) * new_w)
                            y1 = int((ymin / 1000) * new_h)
                            x2 = int((xmax / 1000) * new_w)
                            y2 = int((ymax / 1000) * new_h)
                            bboxes_to_blur.append((x1, y1, x2, y2))

                            findings.append(
                                Finding(
                                    id=f"fnd_{uuid.uuid4().hex[:8]}",
                                    category=item.get("category", "OTHER").upper(),  # type: ignore
                                    text="[REDACTED_IMAGE_REGION]",
                                    confidence=float(item.get("confidence", 0.9)),
                                    bbox=[ymin, xmin, ymax, xmax],
                                    source="gemma",
                                    placeholder="[IMAGE_REDACTED]",
                                )
                            )
            except Exception as e:
                logger.warning(f"Gemma vision box detection failed, falling back: {e}")

        # Mode B Fallback: RapidOCR word-box detection
        if (mode == "text" or (mode == "auto" and len(bboxes_to_blur) == 0)):
            try:
                import numpy as np
                from rapidocr_onnxruntime import RapidOCR

                ocr = RapidOCR()
                img_np = np.array(img)
                ocr_result, _ = ocr(img_np)

                if ocr_result:
                    for line in ocr_result:
                        dt_boxes, text_val, score = line
                        # Check if OCR word text matches any sensitive regex pattern
                        text_val = str(text_val)
                        is_sensitive = False
                        matched_cat = "OTHER"

                        for cat, pattern, _ in self.REGEX_PATTERNS:
                            if pattern.search(text_val):
                                is_sensitive = True
                                matched_cat = cat
                                break

                        # Also flag names or account triggers
                        if not is_sensitive and any(kw in text_val.lower() for kw in ("name", "dob", "card", "bank", "id", "signature")):
                            is_sensitive = True
                            matched_cat = "OTHER"

                        if is_sensitive:
                            # dt_boxes: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
                            pts = np.array(dt_boxes, dtype=np.int32)
                            min_x = max(0, int(np.min(pts[:, 0])))
                            min_y = max(0, int(np.min(pts[:, 1])))
                            max_x = min(new_w, int(np.max(pts[:, 0])))
                            max_y = min(new_h, int(np.max(pts[:, 1])))

                            bboxes_to_blur.append((min_x, min_y, max_x, max_y))
                            findings.append(
                                Finding(
                                    id=f"fnd_{uuid.uuid4().hex[:8]}",
                                    category=matched_cat,  # type: ignore
                                    text=text_val,
                                    confidence=float(score),
                                    bbox=[
                                        int(min_y / new_h * 1000),
                                        int(min_x / new_w * 1000),
                                        int(max_y / new_h * 1000),
                                        int(max_x / new_w * 1000),
                                    ],
                                    source="ocr+gemma",
                                    placeholder="[OCR_REDACTED]",
                                )
                            )
            except Exception as e:
                logger.error(f"RapidOCR fallback error: {e}")

        # Apply blur/blackout over detected bounding boxes
        redacted_img = img.copy()
        draw = ImageDraw.Draw(redacted_img)

        for x1, y1, x2, y2 in bboxes_to_blur:
            box_w = x2 - x1
            box_h = y2 - y1
            if box_w <= 0 or box_h <= 0:
                continue
            # Blur region
            region = redacted_img.crop((x1, y1, x2, y2))
            blurred_region = region.filter(ImageFilter.GaussianBlur(radius=16))
            redacted_img.paste(blurred_region, (x1, y1))
            # Also draw clean dark security border
            draw.rectangle((x1, y1, x2, y2), outline="#ef4444", width=2)

        # Output base64 JPEG
        out_buf = io.BytesIO()
        redacted_img.save(out_buf, format="JPEG", quality=90)
        b64_output = base64.b64encode(out_buf.getvalue()).decode("utf-8")

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        return ShieldResult(
            session_id=session_id,
            mode="box" if len(bboxes_to_blur) > 0 else "text",
            findings=findings,
            redacted_text=None,
            redacted_image_b64=b64_output,
            stats={
                "total_regions_redacted": len(bboxes_to_blur),
                "duration_ms": duration_ms,
            },
        )


shield_service = ShieldService()
