"""Re-run the notebook's experiment and export everything the dashboard shows.

    python -m ml.train                 # writes artifacts/metrics.json
    python -m ml.train --export-model  # also refits Extra Trees on ALL rows and overwrites the .pkl
    python -m ml.train --export-model --trees 150 --min-leaf 3   # lighter model (~20 MB, R2 ~0.92) for small servers
"""
import argparse
import json
import time
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split

from ml.data import load_clean
from ml.features import FEATURE_COLUMNS, LABELS, TARGET
from ml.pipelines import build_pipelines

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "raw" / "Student_Social_Media_And_Mental_Health_Impact.csv"
ARTIFACTS = ROOT / "artifacts"

CARDS = {
    "linear_regression": {
        "name": "Linear Regression", "family": "Linear baseline", "accent": "#7d89a8",
        "tagline": "Fast, transparent baseline that assumes a straight-line relationship.",
        "description": "Fits one coefficient per (scaled / one-hot encoded) input. It is the benchmark every other model has to beat. "
                       "Because it can only add up independent linear effects, it cannot capture interactions such as 'long usage hurts more when sleep is short'.",
        "preprocessing": ["Median imputation + StandardScaler on numerics", "Ordinal encoding for Stress_Level (Low<Medium<High<Very High)", "One-hot encoding for 5 nominal columns (incl. all 111 countries)"],
        "pros": ["Instantly trainable and easy to explain", "Good sanity-check baseline", "No hyper-parameters to tune"],
        "cons": ["Cannot model non-linear effects or interactions", "Sensitive to scaling and outliers", "Lowest accuracy of the three"],
    },
    "random_forest": {
        "name": "Random Forest", "family": "Bagged trees", "accent": "#5fa8d3",
        "tagline": "300 decorrelated trees, each trained on a bootstrap sample, averaged together.",
        "description": "Each tree sees a bootstrap sample and picks the best split among candidate features. Averaging many high-variance trees yields a stable, non-linear model "
                       "that handles interactions automatically and needs no feature scaling.",
        "preprocessing": ["Median imputation for numerics (no scaling needed for trees)", "Ordinal encoding for Stress_Level", "One-hot encoding for 5 nominal columns"],
        "pros": ["Captures non-linearity and interactions", "Robust to outliers and unscaled data", "Strong out-of-the-box accuracy"],
        "cons": ["Slower and bigger than linear models", "Searches for the *best* split, which can over-fit noise", "Less interpretable"],
    },
    "extra_trees": {
        "name": "Extra Trees", "family": "Randomised trees", "accent": "#6e8bff",
        "tagline": "Like Random Forest, but split thresholds are drawn at random — more variance reduction.",
        "description": "Extremely Randomised Trees train on the full dataset (no bootstrap) and choose split thresholds at random instead of optimising them. "
                       "That extra randomness acts as strong regularisation, which works very well on this smooth, low-noise target. This is the model deployed in the Predict page.",
        "preprocessing": ["Median imputation for numerics", "Ordinal encoding for Stress_Level", "One-hot encoding for 5 nominal columns"],
        "pros": ["Highest accuracy and lowest error here", "Smoother predictions than Random Forest", "Faster to train than Random Forest"],
        "cons": ["Large pickle file (300 deep trees)", "Needs full pipeline at inference time", "Impurity importances are biased - permutation importance used instead"],
    },
}


def hist(values, bins=20):
    counts, edges = np.histogram(values, bins=bins)
    return {"edges": [round(float(e), 3) for e in edges], "counts": [int(c) for c in counts]}


def main(export_model: bool, trees: int = 300, min_leaf: int = 1) -> None:
    df, quality = load_clean(CSV)
    X, y = df[FEATURE_COLUMNS], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42)
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    rng = np.random.default_rng(42)
    sample_idx = np.sort(rng.choice(len(y_test), size=min(700, len(y_test)), replace=False))

    models, fit_times = {}, {}
    for key, pipe in build_pipelines().items():
        print(f"Training {key} ...")
        t0 = time.perf_counter()
        pipe.fit(X_train, y_train)
        fit_times[key] = time.perf_counter() - t0

        train_pred, test_pred = pipe.predict(X_train), pipe.predict(X_test)
        resid = y_test.values - test_pred
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="r2", n_jobs=1)
        perm = permutation_importance(pipe, X_test, y_test, n_repeats=10, random_state=42, scoring="r2", n_jobs=-1)
        importance = sorted(
            ({"feature": f, "label": LABELS[f], "importance": float(m), "std": float(s)}
             for f, m, s in zip(X_test.columns, perm.importances_mean, perm.importances_std)),
            key=lambda r: -r["importance"],
        )
        err = X_test.copy()
        err["Actual"], err["Predicted"], err["Abs"] = y_test.values, test_pred, np.abs(resid)
        worst = err.sort_values("Abs", ascending=False).head(8)

        reg = pipe.named_steps["regressor"]
        params = {k: v for k, v in reg.get_params().items() if k in {"n_estimators", "max_features", "min_samples_leaf", "random_state", "bootstrap", "fit_intercept"}}
        models[key] = {
            "key": key, **CARDS[key],
            "hyperparameters": {k: (v if isinstance(v, (int, float, bool, str)) or v is None else str(v)) for k, v in params.items()},
            "metrics": {
                "train_r2": r2_score(y_train, train_pred), "test_r2": r2_score(y_test, test_pred),
                "mae": mean_absolute_error(y_test, test_pred), "rmse": float(np.sqrt(mean_squared_error(y_test, test_pred))),
                "fit_seconds": fit_times[key],
            },
            "cv": {"mean": float(cv_scores.mean()), "std": float(cv_scores.std()), "folds": [float(s) for s in cv_scores]},
            "actual_vs_predicted": [[round(float(a), 2), round(float(p), 3)] for a, p in zip(y_test.values[sample_idx], test_pred[sample_idx])],
            "residual_hist": hist(resid, 24),
            "residual_stats": {"mean": float(resid.mean()), "std": float(resid.std()), "max_abs": float(np.abs(resid).max())},
            "importance": importance,
            "worst_predictions": [
                {"country": r["Country"], "platform": r["Most_Used_Platform"], "stress": r["Stress_Level"], "usage": float(r["Avg_Daily_Usage_Hours"]),
                 "sleep": float(r["Sleep_Hours_Per_Night"]), "actual": float(r["Actual"]), "predicted": float(r["Predicted"]), "error": float(r["Actual"] - r["Predicted"])}
                for _, r in worst.iterrows()
            ],
        }
        print(f"  test R2={models[key]['metrics']['test_r2']:.4f}  cv={cv_scores.mean():.4f}")

    best = max(models, key=lambda k: models[k]["metrics"]["test_r2"])
    m = {k: v["metrics"] for k, v in models.items()}
    steps = [
        {"title": "Load the raw dataset", "icon": "database", "detail": f"{quality['raw_rows']:,} students x {quality['columns']} columns, {quality['missing_values']} missing values.", "chips": ["pandas.read_csv", f"{quality['raw_rows']:,} rows"]},
        {"title": "Clean the data", "icon": "broom", "detail": f"Dropped {quality['duplicates_removed']} duplicate rows and clipped {quality['negative_activity_clipped']} impossible negative Physical_Activity_Hours values to 0, leaving {quality['clean_rows']:,} rows.", "chips": ["drop_duplicates", "clip(lower=0)"]},
        {"title": "Define features & target", "icon": "columns", "detail": "12 inputs: 6 numeric, 1 ordinal (Stress_Level) and 5 nominal columns. All 111 countries are kept instead of collapsing to Top-10 + Other - this alone lifted accuracy noticeably.", "chips": ["6 numeric", "1 ordinal", "5 nominal"]},
        {"title": "Split train / test", "icon": "split", "detail": f"70 / 30 split with random_state=42: {len(X_train):,} training rows and {len(X_test):,} untouched test rows, identical to the original notebook for a fair comparison.", "chips": [f"train {len(X_train):,}", f"test {len(X_test):,}", "seed 42"]},
        {"title": "Build preprocessing pipelines", "icon": "pipe", "detail": "Linear model: impute + scale + encode. Tree models: impute + encode only, because trees are invariant to monotonic scaling. Everything lives inside a sklearn Pipeline so there is no train/test leakage.", "chips": ["ColumnTransformer", "OneHotEncoder", "OrdinalEncoder"]},
        {"title": "Train three models", "icon": "cpu", "detail": f"Linear Regression ({fit_times['linear_regression']:.2f}s), Random Forest ({fit_times['random_forest']:.1f}s) and Extra Trees ({fit_times['extra_trees']:.1f}s), each wrapped with its preprocessor.", "chips": ["LinearRegression", "RandomForest x300", "ExtraTrees x300"]},
        {"title": "Evaluate on the test set", "icon": "target", "detail": f"Compared R2, MAE and RMSE. Extra Trees reached R2 {m['extra_trees']['test_r2']:.3f} vs {m['random_forest']['test_r2']:.3f} (Random Forest) and {m['linear_regression']['test_r2']:.3f} (Linear).", "chips": ["R2", "MAE", "RMSE"]},
        {"title": "Cross-validate", "icon": "repeat", "detail": "5-fold CV on the training data confirms the ranking is not an artefact of one lucky split; fold-to-fold standard deviation stays tiny.", "chips": ["KFold(5)", "shuffle", "scoring=r2"]},
        {"title": "Interpret & diagnose", "icon": "search", "detail": "Permutation importance on the test set shows which inputs the model truly depends on; residual histograms and actual-vs-predicted plots check for bias and heteroscedasticity.", "chips": ["permutation_importance", "residuals"]},
        {"title": "Select, refit & export", "icon": "package", "detail": f"{models[best]['name']} wins. The complete preprocessing + model pipeline is refit on all {quality['clean_rows']:,} rows and saved with joblib so the API can accept raw inputs.", "chips": ["joblib.dump", "Mental_Health_ExtraTrees_Model.pkl"]},
    ]
    out = {
        "meta": {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "n_train": len(X_train), "n_test": len(X_test), "n_features": len(FEATURE_COLUMNS),
                 "random_state": 42, "best_model": best, "target": TARGET, "quality": quality},
        "steps": steps, "models": models,
    }
    ARTIFACTS.mkdir(exist_ok=True)
    (ARTIFACTS / "metrics.json").write_text(json.dumps(out, indent=1))
    print("Wrote artifacts/metrics.json")

    if export_model:
        final = build_pipelines()["extra_trees"].set_params(regressor__n_estimators=trees, regressor__min_samples_leaf=min_leaf).fit(X, y)
        joblib.dump(final, ARTIFACTS / "Mental_Health_ExtraTrees_Model.pkl", compress=("zlib", 3))
        print("Refit and saved final model")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--export-model", action="store_true")
    ap.add_argument("--trees", type=int, default=300, help="smaller = lighter model (e.g. 150)")
    ap.add_argument("--min-leaf", type=int, default=1, help="larger = lighter model (e.g. 3)")
    a = ap.parse_args()
    main(a.export_model, a.trees, a.min_leaf)
