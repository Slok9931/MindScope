from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_analytics
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/options")
def options(svc: Annotated[AnalyticsService, Depends(get_analytics)]):
    """Category lists and numeric ranges used to build the prediction form."""
    return svc.options()


@router.get("/overview")
def overview(
    svc: Annotated[AnalyticsService, Depends(get_analytics)],
    gender: Literal["Male", "Female"] | None = Query(None),
    academic_level: Literal["High School", "Undergraduate", "Graduate"] | None = Query(None),
):
    data = svc.overview(gender, academic_level)
    if data is None:
        raise HTTPException(404, "Too few students match this filter.")
    return data
