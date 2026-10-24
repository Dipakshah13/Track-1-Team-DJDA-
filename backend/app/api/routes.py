"""
FastAPI route handlers for Shield and Guard services (Player 3).
Matches specs in docs/TRD.md §5 and TEAM_TASKS.md.
"""

from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from app.core.models import GuardVerdict, ShieldResult, ShieldTextRequest
from app.services.guard import guard_service
from app.services.shield import shield_service

router = APIRouter(prefix="/api", tags=["Shield & Guard"])


class RestoreRequest(BaseModel):
    redacted_text: str
    session_id: str = "default"


class RestoreResponse(BaseModel):
    restored_text: str


@router.post("/shield/text", response_model=ShieldResult)
async def redact_text_endpoint(req: ShieldTextRequest):
    """
    Scans text for sensitive PII (Aadhaar, PAN, phone, email, names, cards),
    redacts them with typed placeholders, and saves session de-anonymization map.
    """
    try:
        session_id = req.session_id or "default"
        return await shield_service.redact_text(req.text, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text redaction failed: {str(e)}")


@router.post("/shield/image", response_model=ShieldResult)
async def redact_image_endpoint(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form("default"),
    mode: Optional[str] = Form("auto"),
):
    """
    Ingests an image (PNG/JPEG), runs Gemma 4 box_2d detection or RapidOCR fallback,
    and applies Gaussian blur over detected sensitive items.
    """
    try:
        content = await file.read()
        return await shield_service.redact_image(content, session_id=session_id or "default", mode=mode or "auto")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image redaction failed: {str(e)}")


@router.post("/shield/restore", response_model=RestoreResponse)
async def restore_text_endpoint(req: RestoreRequest):
    """
    Locally de-anonymizes and restores original secret values into the answer
    using the safe local session memory.
    """
    restored = shield_service.restore_text(req.redacted_text, session_id=req.session_id)
    return RestoreResponse(restored_text=restored)


@router.post("/guard/scan", response_model=GuardVerdict)
async def scan_guard_endpoint(request: Request):
    """
    Inbound prompt-injection detector:
    Accepts either JSON payload ({"content": "..."}) or multipart form with PDF/document file.
    """
    try:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form = await request.form()
            uploaded_file = form.get("file")
            if uploaded_file and hasattr(uploaded_file, "read"):
                pdf_bytes = await uploaded_file.read()
                return await guard_service.scan_pdf(pdf_bytes)
            text_val = form.get("content") or form.get("text")
            if text_val:
                return await guard_service.scan(str(text_val))
            raise HTTPException(status_code=400, detail="Missing file or content in multipart upload.")
        else:
            # JSON payload
            body = await request.json()
            content = body.get("content") or body.get("text")
            if not content:
                raise HTTPException(status_code=400, detail="Missing 'content' field in request body.")
            return await guard_service.scan(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guard scan failed: {str(e)}")
