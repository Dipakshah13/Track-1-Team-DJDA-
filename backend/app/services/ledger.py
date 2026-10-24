"""
Tamper-evident, cryptographic hash-chain ledger for Gemma Aegis.
Implements TRD §10: Privacy Receipts and immutable audit trail.
Uses SQLite with canonical JSON serialization and SHA-256 chaining.
"""

import hashlib
import json
import logging
import sqlite3
import time
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.models import LedgerEntry, LedgerVerifyResult

logger = logging.getLogger("ledger_service")

GENESIS_PREV_HASH = "0" * 64

# Strict metadata allowlist (Hard Rule 2 from AGENTS.md: No raw sensitive values in ledger)
ALLOWED_META_KEYS = {
    "counts_by_category",
    "total_findings",
    "verdict",
    "risk_score",
    "attack_types",
    "route",
    "duration_ms",
    "mode",
    "session_id",
    "status",
    "model_used",
}


def canonical_json(data: Dict[str, Any]) -> str:
    """Serialize dictionary to deterministic, sorted, whitespace-free JSON string."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def compute_sha256(content: str) -> str:
    """Compute SHA-256 hex digest of string content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class LedgerService:
    """Manages SQLite-backed cryptographic hash chain."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DB_PATH
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Create a new SQLite connection with immediate mode support."""
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initialize the ledger table if it does not exist."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    action TEXT NOT NULL,
                    meta_json TEXT NOT NULL,
                    input_hash TEXT NOT NULL,
                    output_hash TEXT NOT NULL,
                    prev_hash TEXT NOT NULL,
                    entry_hash TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def filter_meta(self, raw_meta: Dict[str, Any]) -> Dict[str, Any]:
        """Enforce strict allowlist on metadata to guarantee no secrets are stored."""
        clean_meta = {}
        for k, v in raw_meta.items():
            if k in ALLOWED_META_KEYS:
                clean_meta[k] = v
        return clean_meta

    def append_entry(
        self,
        action: str,
        meta: Dict[str, Any],
        input_data: str,
        output_data: str,
    ) -> LedgerEntry:
        """
        Append a new tamper-evident audit record to the hash chain.
        Executes inside an atomic transaction with BEGIN IMMEDIATE.
        """
        input_hash = compute_sha256(input_data)
        output_hash = compute_sha256(output_data)
        safe_meta = self.filter_meta(meta)
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        with self._get_connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            # Retrieve the latest entry to get prev_hash
            cursor = conn.execute("SELECT id, entry_hash FROM ledger ORDER BY id DESC LIMIT 1")
            last_row = cursor.fetchone()

            if last_row is None:
                next_id = 1
                prev_hash = GENESIS_PREV_HASH
            else:
                next_id = int(last_row["id"]) + 1
                prev_hash = str(last_row["entry_hash"])

            # Compute entry hash: SHA256( prev_hash || canonical_json(entry_payload) )
            payload_dict = {
                "id": next_id,
                "ts": ts,
                "action": action,
                "meta": safe_meta,
                "input_hash": input_hash,
                "output_hash": output_hash,
            }
            canonical_payload = canonical_json(payload_dict)
            entry_hash = compute_sha256(prev_hash + canonical_payload)

            conn.execute(
                """
                INSERT INTO ledger (id, ts, action, meta_json, input_hash, output_hash, prev_hash, entry_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    next_id,
                    ts,
                    action,
                    json.dumps(safe_meta),
                    input_hash,
                    output_hash,
                    prev_hash,
                    entry_hash,
                ),
            )
            conn.commit()

            return LedgerEntry(
                id=next_id,
                ts=ts,
                action=action,
                meta=safe_meta,
                input_hash=input_hash,
                output_hash=output_hash,
                prev_hash=prev_hash,
                entry_hash=entry_hash,
            )

    def list_entries(self, limit: int = 50) -> List[LedgerEntry]:
        """Fetch the most recent ledger entries in descending order."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM ledger ORDER BY id DESC LIMIT ?",
                (limit,),
            )
            rows = cursor.fetchall()

            entries = []
            for r in rows:
                entries.append(
                    LedgerEntry(
                        id=r["id"],
                        ts=r["ts"],
                        action=r["action"],
                        meta=json.loads(r["meta_json"]),
                        input_hash=r["input_hash"],
                        output_hash=r["output_hash"],
                        prev_hash=r["prev_hash"],
                        entry_hash=r["entry_hash"],
                    )
                )
            return entries

    def verify_integrity(self) -> LedgerVerifyResult:
        """
        Verify the complete hash chain from row 1 to N.
        Recomputes all cryptographic links and detects any broken or tampered record.
        """
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM ledger ORDER BY id ASC")
            rows = cursor.fetchall()

            if not rows:
                return LedgerVerifyResult(valid=True, checked=0, first_broken_id=None)

            expected_prev_hash = GENESIS_PREV_HASH

            for idx, r in enumerate(rows):
                entry_id = int(r["id"])
                actual_prev_hash = str(r["prev_hash"])
                actual_entry_hash = str(r["entry_hash"])

                # 1. Verify prev_hash matches expected chain link
                if actual_prev_hash != expected_prev_hash:
                    logger.warning(f"Ledger broken at row {entry_id}: prev_hash mismatch!")
                    return LedgerVerifyResult(valid=False, checked=idx, first_broken_id=entry_id)

                # 2. Recompute entry_hash from contents
                payload_dict = {
                    "id": entry_id,
                    "ts": str(r["ts"]),
                    "action": str(r["action"]),
                    "meta": json.loads(r["meta_json"]),
                    "input_hash": str(r["input_hash"]),
                    "output_hash": str(r["output_hash"]),
                }
                recomputed_entry_hash = compute_sha256(actual_prev_hash + canonical_json(payload_dict))

                if recomputed_entry_hash != actual_entry_hash:
                    logger.warning(f"Ledger broken at row {entry_id}: entry_hash payload mismatch!")
                    return LedgerVerifyResult(valid=False, checked=idx, first_broken_id=entry_id)

                expected_prev_hash = actual_entry_hash

            return LedgerVerifyResult(valid=True, checked=len(rows), first_broken_id=None)

    def simulate_tamper(self, entry_id: int, fake_action: str = "TAMPERED_ACTION") -> bool:
        """
        Demonstration helper: Deliberately alters a database row to prove
        that the cryptographic verification immediately detects tampering.
        """
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT id FROM ledger WHERE id = ?", (entry_id,))
            if not cursor.fetchone():
                return False
            conn.execute("UPDATE ledger SET action = ? WHERE id = ?", (fake_action, entry_id))
            conn.commit()
            return True


ledger_service = LedgerService()
