"""
Configuration management for Gemma Aegis backend.
Uses standard environment variables with defaults matching docs/TRD.md and .env.example.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    LOCAL_MODEL: str = os.getenv("LOCAL_MODEL", "gemma4:e4b")
    CLOUD_MODEL: str = os.getenv("CLOUD_MODEL", "gemma-4-31b-it")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LOCAL_ONLY: bool = os.getenv("LOCAL_ONLY", "false").lower() in ("true", "1", "yes")
    DETECTION_MODE: str = os.getenv("DETECTION_MODE", "auto")
    DB_PATH: str = os.getenv("DB_PATH", "./aegis.db")
    DEMO_SCRIPTED: bool = os.getenv("DEMO_SCRIPTED", "false").lower() in ("true", "1", "yes")

settings = Settings()
