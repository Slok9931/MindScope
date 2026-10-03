from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.services.analytics import AnalyticsService
from app.services.predictor import Predictor
from app.services.registry import ModelRegistry

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy objects once at start-up, not per request."""
    app.state.analytics = AnalyticsService(settings.dataset_path)
    app.state.predictor = Predictor(settings.model_path, app.state.analytics.reference)
    app.state.registry = ModelRegistry(settings.metrics_path)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router)

# Production: serve the built React app from the same origin (SPA fallback to index.html).
dist = settings.frontend_dist
if dist.exists():
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        file = dist / path
        return FileResponse(file if path and file.is_file() else dist / "index.html")
