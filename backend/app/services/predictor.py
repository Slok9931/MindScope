"""Wraps the persisted sklearn pipeline: prediction, uncertainty band and what-if curves."""
import warnings

import joblib
import numpy as np
import pandas as pd
from scipy import sparse

from app.schemas.prediction import PredictionRequest
from ml.features import FEATURE_COLUMNS, LABELS, NUMERIC_FEATURES, TARGET

SENSITIVITY = {
    "Avg_Daily_Usage_Hours": "h / day", "Sleep_Hours_Per_Night": "h / night",
    "Physical_Activity_Hours": "h / day", "Study_Hours": "h / day",
}
BANDS = [
    (4.5, "Needs attention", "bad", "Predicted wellbeing is well below the typical student in this dataset."),
    (6.0, "Fair", "warn", "Slightly below the typical student - small habit changes could help."),
    (7.5, "Good", "good", "Around or above the dataset average."),
    (99, "Excellent", "great", "Among the highest predicted wellbeing scores in the dataset."),
]


class Predictor:
    def __init__(self, model_path, reference: pd.DataFrame):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.pipeline = joblib.load(model_path)
        self.reference = reference
        self.scores = np.sort(reference[TARGET].to_numpy())
        self.valid_countries = set(reference["Country"].unique())
        self.bounds = {c: (float(reference[c].min()), float(reference[c].max())) for c in NUMERIC_FEATURES}

    def _frame(self, rows: list[dict]) -> pd.DataFrame:
        return pd.DataFrame(rows)[FEATURE_COLUMNS]

    def _tree_spread(self, row: pd.DataFrame) -> tuple[float, float]:
        pre, reg = self.pipeline.named_steps["preprocessor"], self.pipeline.named_steps["regressor"]
        xt = pre.transform(row)
        xt = xt.toarray() if sparse.issparse(xt) else xt
        xt = np.ascontiguousarray(xt, dtype=np.float32)
        per_tree = np.array([t.predict(xt, check_input=False)[0] for t in reg.estimators_])
        return float(np.percentile(per_tree, 10)), float(np.percentile(per_tree, 90))

    def predict(self, req: PredictionRequest) -> dict:
        base = req.model_dump()
        frame = self._frame([base])
        score = float(self.pipeline.predict(frame)[0])
        low, high = self._tree_spread(frame)

        warns = [f"{LABELS[c]} = {base[c]:g} is outside the range seen in training ({lo:g} to {hi:g}); the model is extrapolating." for c, (lo, hi) in self.bounds.items() if not lo <= base[c] <= hi]
        label, tone, msg = next((b[1], b[2], b[3]) for b in BANDS if score < b[0])

        sens = {}
        for feat, unit in SENSITIVITY.items():
            lo, hi = self.bounds[feat]
            grid = np.round(np.linspace(lo, hi, 14), 2)
            preds = self.pipeline.predict(self._frame([{**base, feat: float(v)} for v in grid]))
            sens[feat] = {"label": LABELS[feat], "unit": unit, "current": base[feat], "points": [[float(x), round(float(y), 3)] for x, y in zip(grid, preds)]}

        mean = float(self.scores.mean())
        return {
            "score": round(score, 3), "low": round(min(low, score), 3), "high": round(max(high, score), 3),
            "percentile": round(float(np.searchsorted(self.scores, score) / len(self.scores) * 100), 1),
            "dataset_mean": round(mean, 3), "delta_vs_mean": round(score - mean, 3),
            "band": {"label": label, "tone": tone, "message": msg}, "warnings": warns, "sensitivity": sens,
        }
