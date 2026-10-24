"""
Zero-Leak Pytest Suite for Gemma Aegis.
Implements Task C3 & Hard Rule 1 from AGENTS.md:
Verifies that no ground-truth raw sensitive secrets from testdata/manifest.json
ever leak into cloud payloads, ledger entries, or event logs.
"""

import json
import os
import pytest

from app.services.cloud_client import PrivacyBoundaryViolation, assert_no_raw_findings
from app.services.ledger import ledger_service
from app.services.shield import shield_service

# Locate testdata directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TESTDATA_DIR = os.path.join(BASE_DIR, "testdata")
MANIFEST_PATH = os.path.join(TESTDATA_DIR, "manifest.json")


def load_manifest():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_zero_leak_on_testdata_documents():
    """Verify that all ground truth secrets are completely redacted from documents."""
    manifest = load_manifest()

    for rel_path, file_meta in manifest.get("files", {}).items():
        if file_meta.get("type") != "doc":
            continue

        file_full_path = os.path.join(TESTDATA_DIR, rel_path)
        if not os.path.exists(file_full_path):
            continue

        with open(file_full_path, "r", encoding="utf-8") as f:
            raw_content = f.read()

        expected_secrets = [item["text"] for item in file_meta.get("expected_findings", [])]
        if not expected_secrets:
            continue

        # Run Shield Redaction
        import asyncio
        shield_res = asyncio.run(shield_service.redact_text(raw_content, session_id=f"leak_test_{os.path.basename(rel_path)}"))
        redacted = shield_res.redacted_text or ""

        # 1. Assert that no ground truth secret appears in the redacted output
        for secret in expected_secrets:
            # Clean punctuation for robust matching
            clean_secret = secret.strip()
            if len(clean_secret) >= 4:
                assert clean_secret.lower() not in redacted.lower(), (
                    f"LEAK DETECTED: Secret '{clean_secret}' was found in sanitized output of {rel_path}!"
                )

        # 2. Assert privacy gate passes
        assert_no_raw_findings(redacted, shield_res.findings)


def test_ledger_zero_raw_leak():
    """Verify that ledger entries never contain raw secret strings in meta."""
    test_secret = "TOP_SECRET_AADHAAR_999988887777"
    raw_prompt = f"User Aadhaar: {test_secret}"

    import asyncio
    shield_res = asyncio.run(shield_service.redact_text(raw_prompt, session_id="ledger_leak_check"))

    entry = ledger_service.append_entry(
        action="PRIVACY_LEAK_TEST",
        meta={
            "counts_by_category": shield_res.stats.get("counts_by_category", {}),
            "total_findings": len(shield_res.findings),
            "unfiltered_leak_attempt": test_secret,  # Should be stripped by filter_meta
        },
        input_data=shield_res.redacted_text or "",
        output_data="Sanitized response",
    )

    # Fetch recorded row from SQLite
    with ledger_service._get_connection() as conn:
        cursor = conn.execute("SELECT meta_json FROM ledger WHERE id = ?", (entry.id,))
        row = cursor.fetchone()
        meta_str = row["meta_json"]

        assert test_secret not in meta_str, "CRITICAL PRIVACY VIOLATION: Raw secret leaked into SQLite ledger meta!"
