"""
Server-Sent Events (SSE) bus for real-time live execution tracing.
Matches specs in docs/TRD.md §5 and §14.
"""

import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Dict, List, Optional

from app.core.models import TraceEvent

logger = logging.getLogger("event_bus")


class EventBus:
    """Manages active SSE channels and event publishing per pipeline run."""

    def __init__(self):
        # run_id -> list of subscriber queues
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        # run_id -> history of past events for late-joining clients
        self._history: Dict[str, List[TraceEvent]] = {}
        self._lock = asyncio.Lock()

    async def register(self, run_id: str) -> asyncio.Queue:
        """Register a new listener queue for a run_id."""
        async with self._lock:
            q: asyncio.Queue = asyncio.Queue()
            if run_id not in self._subscribers:
                self._subscribers[run_id] = []
            self._subscribers[run_id].append(q)

            # Replay any existing events to late-joining subscriber
            if run_id in self._history:
                for past_event in self._history[run_id]:
                    await q.put(past_event)

            return q

    async def unregister(self, run_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue."""
        async with self._lock:
            if run_id in self._subscribers:
                if queue in self._subscribers[run_id]:
                    self._subscribers[run_id].remove(queue)
                if not self._subscribers[run_id]:
                    # Keep history for retrieval but remove empty list
                    self._subscribers.pop(run_id, None)

    async def publish(self, run_id: str, event: TraceEvent) -> None:
        """Publish a TraceEvent to all active subscribers of run_id."""
        async with self._lock:
            # Store in history
            if run_id not in self._history:
                self._history[run_id] = []
            self._history[run_id].append(event)

            # Dispatch to subscribers
            queues = self._subscribers.get(run_id, [])
            for q in queues:
                await q.put(event)

    def get_history(self, run_id: str) -> List[TraceEvent]:
        """Get all recorded events for a run."""
        return self._history.get(run_id, [])

    async def emit(
        self,
        run_id: str,
        step: str,
        status: str,
        detail: str,
        data: Optional[Dict] = None,
    ) -> None:
        """Helper to construct and emit a TraceEvent."""
        event = TraceEvent(
            ts=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            step=step,  # type: ignore
            status=status,  # type: ignore
            detail=detail,
            data=data,
        )
        await self.publish(run_id, event)

    async def sse_stream(self, run_id: str) -> AsyncGenerator[str, None]:
        """Generator yielding SSE formatted strings for FastAPI EventSourceResponse."""
        queue = await self.register(run_id)
        try:
            while True:
                # Wait for next event with a periodic heartbeat
                try:
                    event: TraceEvent = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {event.model_dump_json()}\n\n"
                    # If this was the final ledger or error event, stop after short delay
                    if event.step == "ledger" and event.status in ("done", "error"):
                        break
                except asyncio.TimeoutError:
                    # Send comment heartbeat to keep connection alive
                    yield ": ping\n\n"
        finally:
            await self.unregister(run_id, queue)


event_bus = EventBus()
