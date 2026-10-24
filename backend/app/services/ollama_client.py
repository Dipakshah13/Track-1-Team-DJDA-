"""
Asynchronous Ollama client for Gemma Aegis.
Handles chat, generate, and multimodal image inspection with Gemma 4.
"""

import base64
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("ollama_client")


class OllamaClient:
    """Async client interface for local Ollama instance."""

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None, timeout: float = 60.0):
        self.base_url = (base_url or settings.OLLAMA_URL).rstrip("/")
        self.model = model or settings.LOCAL_MODEL
        self.timeout = timeout

    async def is_healthy(self) -> bool:
        """Check whether Ollama API is reachable."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False

    async def list_models(self) -> List[str]:
        """List all models currently installed in Ollama."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    return [m.get("name", "") for m in data.get("models", [])]
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
        return []

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.0,
        format_type: Optional[str] = "json",
        stream: bool = False,
    ) -> Any:
        """Send chat messages to the local model."""
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
            },
        }
        if format_type:
            payload["format"] = format_type

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/chat", json=payload)
            res.raise_for_status()
            data = res.json()
            return data.get("message", {}).get("content", "")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        format_type: Optional[str] = "json",
    ) -> str:
        """Generate a completion for the given prompt."""
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt
        if format_type:
            payload["format"] = format_type

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            res.raise_for_status()
            data = res.json()
            return data.get("response", "")

    async def chat_with_image(
        self,
        prompt: str,
        image_bytes: bytes,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        format_type: Optional[str] = "json",
    ) -> str:
        """Send an image along with a prompt to multimodal Gemma 4."""
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({
            "role": "user",
            "content": prompt,
            "images": [b64_image],
        })

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if format_type:
            payload["format"] = format_type

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(f"{self.base_url}/api/chat", json=payload)
            res.raise_for_status()
            data = res.json()
            return data.get("message", {}).get("content", "")

    async def parse_json_response(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON object from model response safely."""
        cleaned = text.strip()
        # Strip potential markdown fences if present
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback search for first { and last }
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(cleaned[start : end + 1])
            raise


ollama_client = OllamaClient()
