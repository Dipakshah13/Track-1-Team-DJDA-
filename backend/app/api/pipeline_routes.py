"""
FastAPI routes for Secure Chat Pipeline and SSE real-time event streaming.
Matches specs in docs/TRD.md §5.
"""

import asyncio
import uuid
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.core.events import event_bus
from app.core.models import PipelineRunResult, SecureChatRequest
from app.services.pipeline import pipeline_service

router = APIRouter(prefix="/api", tags=["Pipeline & SSE"])


@router.post("/secure-chat")
async def start_secure_chat(
    req: SecureChatRequest,
    background_tasks: BackgroundTasks,
):
    """
    Initiate an end-to-end secure chat workflow.
    Returns immediately with run_id. Clients connect to /api/events/{run_id} for live trace.
    """
    run_id = f"run_{uuid.uuid4().hex[:10]}"

    # Dispatch pipeline execution in background task
    background_tasks.add_task(
        pipeline_service.execute_secure_chat,
        prompt=req.prompt,
        session_id=req.session_id or "default",
        run_id=run_id,
    )

    return {
        "run_id": run_id,
        "session_id": req.session_id or "default",
        "status": "processing",
        "sse_url": f"/api/events/{run_id}",
    }


@router.post("/secure-chat/sync", response_model=PipelineRunResult)
async def execute_secure_chat_sync(req: SecureChatRequest):
    """
    Synchronous version of secure chat: awaits full execution and returns complete result.
    Ideal for direct testing, benchmarks, and simple REST integrations.
    """
    try:
        return await pipeline_service.execute_secure_chat(
            prompt=req.prompt,
            session_id=req.session_id or "default",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")


@router.get("/events/{run_id}")
async def stream_run_events(run_id: str):
    """
    Server-Sent Events (SSE) endpoint providing live, step-by-step trace of execution:
    Guard -> Shield -> Router -> Model -> Restore -> Ledger.
    """
    return EventSourceResponse(event_bus.sse_stream(run_id))


@router.get("/runs/{run_id}", response_model=PipelineRunResult)
async def get_run_result(run_id: str):
    """
    Fetch the complete, final execution result for a run (findings, verdict, route, answer, receipt).
    """
    result = pipeline_service.get_run(run_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found or still processing.")
    return result
