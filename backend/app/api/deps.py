from fastapi import Request

from app.services.analytics import AnalyticsService
from app.services.predictor import Predictor
from app.services.registry import ModelRegistry


def get_analytics(request: Request) -> AnalyticsService:
    return request.app.state.analytics


def get_predictor(request: Request) -> Predictor:
    return request.app.state.predictor


def get_registry(request: Request) -> ModelRegistry:
    return request.app.state.registry
