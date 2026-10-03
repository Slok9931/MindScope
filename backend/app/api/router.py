from fastapi import APIRouter

from app.api.routes import analysis, models, predict

api_router = APIRouter(prefix="/api")
api_router.include_router(analysis.router)
api_router.include_router(models.router)
api_router.include_router(predict.router)


@api_router.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
