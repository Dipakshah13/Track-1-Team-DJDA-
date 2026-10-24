"""
FastAPI route handlers for Cryptographic Ledger and Privacy Receipts.
Matches specs in docs/TRD.md §5 and §10.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.models import LedgerEntry, LedgerVerifyResult
from app.services.ledger import ledger_service

router = APIRouter(prefix="/api/ledger", tags=["Audit Ledger"])


class TamperRequest(BaseModel):
    entry_id: int
    fake_action: Optional[str] = "TAMPERED_MALICIOUS_ACTION"


@router.get("", response_model=List[LedgerEntry])
@router.get("/entries", response_model=List[LedgerEntry])
async def list_ledger_entries(limit: int = Query(50, ge=1, le=500)):
    """
    List audit records in descending chronological order.
    Guaranteed: Contains zero raw sensitive data (allowlist metadata only).
    """
    return ledger_service.list_entries(limit=limit)


@router.get("/verify", response_model=LedgerVerifyResult)
async def verify_ledger():
    """
    Cryptographically verify the hash chain from block 1 to N.
    Validates that no record has been altered, injected, or deleted.
    """
    return ledger_service.verify_integrity()


@router.post("/simulate-tamper")
@router.post("/tamper")
async def simulate_tamper_endpoint(req: TamperRequest):
    """
    DEMO HELPER: Deliberately mutates a record in SQLite to demonstrate
    that verification immediately catches tampering and pinpoints the broken ID.
    """
    success = ledger_service.simulate_tamper(req.entry_id, req.fake_action or "TAMPERED_ACTION")
    if not success:
        raise HTTPException(status_code=404, detail=f"Ledger record with ID {req.entry_id} not found.")
    return {
        "status": "tampered",
        "tampered_entry_id": req.entry_id,
        "message": f"Block #{req.entry_id} was modified. Calling /api/ledger/verify should now fail.",
    }
