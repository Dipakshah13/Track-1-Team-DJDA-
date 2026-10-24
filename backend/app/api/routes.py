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
@router.post("/shield/file", response_model=ShieldResult)
async def redact_file_endpoint(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form("default"),
    mode: Optional[str] = Form("auto"),
):
    """
    Ingests ANY uploaded file:
    - Images (PNG, JPG, JPEG, WEBP): runs visual detection & Gaussian blur
    - PDFs: extracts document text via pypdf and runs full hybrid PII redaction
    - Text/Code/Data: decodes content and runs hybrid PII redaction
    """
    try:
        content = await file.read()
        filename = (file.filename or "").lower()
        content_type = (file.content_type or "").lower()

        is_image = (
            content_type.startswith("image/")
            or filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"))
        )

        if is_image:
            return await shield_service.redact_image(
                content, session_id=session_id or "default", mode=mode or "auto"
            )

        if filename.endswith(".pdf") or "pdf" in content_type:
            import io
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            if not extracted_text.strip():
                try:
                    from rapidocr_onnxruntime import RapidOCR
                    ocr = RapidOCR()
                    ocr_lines = []
                    for page in reader.pages:
                        if hasattr(page, "images"):
                            for img_file in page.images:
                                res, _ = ocr(img_file.data)
                                if res:
                                    for line in res:
                                        ocr_lines.append(line[1])
                    if ocr_lines:
                        extracted_text = "\n".join(ocr_lines)
                except Exception:
                    pass

            if not extracted_text.strip():
                extracted_text = f"[Scanned PDF Document: {file.filename}]"
            return await shield_service.redact_text(extracted_text, session_id=session_id or "default")

        # Standard text, markdown, json, csv, etc.
        try:
            text_content = content.decode("utf-8")
        except UnicodeDecodeError:
            text_content = content.decode("latin-1", errors="replace")

        return await shield_service.redact_text(text_content, session_id=session_id or "default")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File redaction failed: {str(e)}")


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
                file_bytes = await uploaded_file.read()
                filename = (getattr(uploaded_file, "filename", "") or "").lower()
                c_type = (getattr(uploaded_file, "content_type", "") or "").lower()
                if filename.endswith(".pdf") or "pdf" in c_type:
                    return await guard_service.scan_pdf(file_bytes)
                else:
                    try:
                        text_val = file_bytes.decode("utf-8")
                    except UnicodeDecodeError:
                        text_val = file_bytes.decode("latin-1", errors="replace")
                    return await guard_service.scan(text_val)
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
