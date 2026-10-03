"""Serves the training results (metrics.json) produced by `python -m ml.train`."""
import json
from pathlib import Path


class ModelRegistry:
    def __init__(self, metrics_path: Path):
        self.data = json.loads(Path(metrics_path).read_text())

    def summary(self) -> dict:
        slim = {}
        for k, m in self.data["models"].items():
            slim[k] = {f: m[f] for f in ("key", "name", "family", "accent", "tagline", "metrics", "cv")}
            slim[k]["top_feature"] = m["importance"][0]["label"]
        return {"meta": self.data["meta"], "steps": self.data["steps"], "models": slim}

    def detail(self, key: str) -> dict | None:
        return self.data["models"].get(key)
