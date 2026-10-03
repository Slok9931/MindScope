from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Student Mental Health Insights API"
    dataset_path: Path = BACKEND_DIR / "data" / "raw" / "Student_Social_Media_And_Mental_Health_Impact.csv"
    model_path: Path = BACKEND_DIR / "artifacts" / "Mental_Health_ExtraTrees_Model.pkl"
    metrics_path: Path = BACKEND_DIR / "artifacts" / "metrics.json"
    frontend_dist: Path = BACKEND_DIR.parent / "frontend" / "dist"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_prefix="MHI_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
