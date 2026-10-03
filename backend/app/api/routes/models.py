from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_registry
from app.services.registry import ModelRegistry

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
def list_models(reg: Annotated[ModelRegistry, Depends(get_registry)]):
    return reg.summary()


@router.get("/{key}")
def model_detail(key: str, reg: Annotated[ModelRegistry, Depends(get_registry)]):
    data = reg.detail(key)
    if data is None:
        raise HTTPException(404, f"Unknown model '{key}'")
    return data
