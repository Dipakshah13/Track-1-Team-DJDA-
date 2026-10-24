"""
FastAPI entry point for Gemma Aegis.
Configured with CORS, health checks, Shield & Guard, Pipeline, Ledger, and Demo/CTF routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.demo_routes import router as demo_router
from app.api.ledger_routes import router as ledger_router
from app.api.pipeline_routes import router as pipeline_router
from app.api.routes import router as shield_guard_router
from app.core.config import settings
from app.services.cloud_client import cloud_client
from app.services.ollama_client import ollama_client

app = FastAPI(
    title="Gemma Aegis API",
    description="Local-first two-way AI firewall powered by Gemma 4",
    version="1.0.0",
)

# CORS Middleware allowing local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(shield_guard_router)
app.include_router(pipeline_router)
app.include_router(ledger_router)
app.include_router(demo_router)


@app.get("/api/health")
async def health_check():
    """
    Checks Ollama local server, installed models, and cloud configuration status.
    """
    ollama_ok = await ollama_client.is_healthy()
    installed_models = await ollama_client.list_models() if ollama_ok else []
    cloud_ok = cloud_client.is_available()

    return {
        "status": "online" if ollama_ok else "degraded",
        "ollama": ollama_ok,
        "cloud": cloud_ok,
        "local_only": settings.LOCAL_ONLY,
        "models": {
            "local_model": settings.LOCAL_MODEL,
            "installed": installed_models,
            "cloud_model": settings.CLOUD_MODEL,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
