from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_predictor
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.predictor import Predictor

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("", response_model=PredictionResponse)
def predict(req: PredictionRequest, svc: Annotated[Predictor, Depends(get_predictor)]):
    if req.Country not in svc.valid_countries:
        raise HTTPException(422, f"Unknown country '{req.Country}'.")
    return svc.predict(req)
