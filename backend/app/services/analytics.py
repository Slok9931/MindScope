"""Pre-computes every chart payload for the Analysis page from the cleaned dataset."""
from functools import lru_cache

import numpy as np
import pandas as pd

from ml.data import load_clean
from ml.features import LABELS, NUMERIC_FEATURES, TARGET

SCATTER_N = 600
STRESS_ORDER = ["Low", "Medium", "High", "Very High"]


def _r(v, d=3):
    return None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), d)


def _hist(s: pd.Series, bins=20) -> dict:
    counts, edges = np.histogram(s, bins=bins)
    return {"edges": [_r(e) for e in edges], "counts": counts.tolist(), "mean": _r(s.mean()), "median": _r(s.median())}


def _box(s: pd.Series, label: str) -> dict:
    q1, med, q3 = s.quantile([.25, .5, .75])
    iqr = q3 - q1
    inside = s[(s >= q1 - 1.5 * iqr) & (s <= q3 + 1.5 * iqr)]
    out = s[(s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)]
    return {"label": label, "n": int(len(s)), "min": _r(inside.min()), "q1": _r(q1), "median": _r(med), "q3": _r(q3), "max": _r(inside.max()), "mean": _r(s.mean()),
            "outliers": [_r(v) for v in out.head(30)]}


def _group(df: pd.DataFrame, col: str, top: int | None = None) -> list[dict]:
    g = df.groupby(col)[TARGET].agg(["count", "mean"]).sort_values("count", ascending=False)
    if top:
        g = g.head(top)
    return [{"label": str(i), "count": int(r["count"]), "mean": _r(r["mean"])} for i, r in g.iterrows()]


def _trend(df: pd.DataFrame, col: str, bins: int) -> list[list]:
    b = pd.cut(df[col], bins=bins)
    g = df.groupby(b, observed=True).agg(x=(col, "mean"), y=(TARGET, "mean"), n=(TARGET, "size"))
    return [[_r(r.x, 2), _r(r.y, 3), int(r.n)] for r in g.itertuples() if r.n >= 8]


class AnalyticsService:
    def __init__(self, csv_path):
        self.df, self.quality = load_clean(csv_path)

    @property
    def reference(self) -> pd.DataFrame:
        return self.df

    def options(self) -> dict:
        df = self.df
        ranges = {c: {"min": _r(df[c].min(), 2), "max": _r(df[c].max(), 2), "mean": _r(df[c].mean(), 2)} for c in NUMERIC_FEATURES}
        return {
            "numeric_ranges": ranges,
            "countries": sorted(df["Country"].unique().tolist()),
            "genders": sorted(df["Gender"].unique().tolist()),
            "academic_levels": ["High School", "Undergraduate", "Graduate"],
            "platforms": sorted(df["Most_Used_Platform"].unique().tolist()),
            "purposes": sorted(df["Purpose_Of_Use"].unique().tolist()),
            "stress_levels": STRESS_ORDER,
            "score": {"min": _r(df[TARGET].min(), 2), "max": _r(df[TARGET].max(), 2), "mean": _r(df[TARGET].mean(), 2)},
        }

    @lru_cache(maxsize=32)
    def overview(self, gender: str | None = None, academic_level: str | None = None) -> dict | None:
        df = self.df
        if gender:
            df = df[df["Gender"] == gender]
        if academic_level:
            df = df[df["Academic_Level"] == academic_level]
        if len(df) < 30:
            return None
        sample = df.sample(min(SCATTER_N, len(df)), random_state=7)
        corr_cols = NUMERIC_FEATURES + [TARGET]
        corr = df[corr_cols].corr()
        with_target = corr[TARGET].drop(TARGET).sort_values(key=abs, ascending=False)

        usage = pd.cut(df["Avg_Daily_Usage_Hours"], bins=np.linspace(df["Avg_Daily_Usage_Hours"].min(), df["Avg_Daily_Usage_Hours"].max() + 1e-9, 7))
        sleep = pd.cut(df["Sleep_Hours_Per_Night"], bins=np.linspace(df["Sleep_Hours_Per_Night"].min(), df["Sleep_Hours_Per_Night"].max() + 1e-9, 7))
        heat = df.groupby([sleep, usage], observed=False)[TARGET].agg(["mean", "size"]).reset_index()
        fmt = lambda iv: f"{iv.left:.1f}-{iv.right:.1f}"
        rows = [fmt(i) for i in sleep.cat.categories]
        cols = [fmt(i) for i in usage.cat.categories]
        vals = np.full((len(rows), len(cols)), np.nan)
        for r in heat.itertuples(index=False):
            if r[3] >= 5:
                vals[list(sleep.cat.categories).index(r[0]), list(usage.cat.categories).index(r[1])] = r[2]

        top, runner = with_target.index[0], with_target.index[1]
        high_stress = (df["Stress_Level"].isin(["High", "Very High"])).mean()
        best_p = df.groupby("Most_Used_Platform")[TARGET].mean().sort_values()
        insights = [
            {"tone": "bad" if with_target.iloc[0] < 0 else "good", "title": f"{LABELS[top]} matters most",
             "text": f"Strongest linear link to the score (r = {with_target.iloc[0]:+.2f}), followed by {LABELS[runner].lower()} (r = {with_target.iloc[1]:+.2f})."},
            {"tone": "warn", "title": "Stress splits the data",
             "text": f"Median score falls from {df[df.Stress_Level == 'Low'][TARGET].median():.1f} (low stress) to {df[df.Stress_Level == 'Very High'][TARGET].median():.1f} (very high stress)." if (df.Stress_Level == 'Low').any() and (df.Stress_Level == 'Very High').any() else "Higher stress levels coincide with lower scores."},
            {"tone": "info", "title": "Platforms differ a little",
             "text": f"{best_p.index[-1]} users score highest on average ({best_p.iloc[-1]:.2f}); {best_p.index[0]} users lowest ({best_p.iloc[0]:.2f})."},
            {"tone": "info", "title": "Heavy stress is common", "text": f"{high_stress:.0%} of the selected students report High or Very High stress."},
        ]
        desc = df[corr_cols].describe().T
        return {
            "filters": {"gender": gender, "academic_level": academic_level},
            "kpis": {"rows": int(len(df)), "countries": int(df.Country.nunique()), "avg_score": _r(df[TARGET].mean(), 2), "avg_usage": _r(df.Avg_Daily_Usage_Hours.mean(), 2),
                     "avg_sleep": _r(df.Sleep_Hours_Per_Night.mean(), 2), "avg_unlocks": _r(df.Daily_Unlocks.mean(), 0), "high_stress_pct": _r(high_stress * 100, 1)},
            "quality": self.quality,
            "insights": insights,
            "score_hist": _hist(df[TARGET], 22),
            "usage_hist": _hist(df.Avg_Daily_Usage_Hours, 18),
            "sleep_hist": _hist(df.Sleep_Hours_Per_Night, 18),
            "stress_box": [_box(df[df.Stress_Level == s][TARGET], s) for s in STRESS_ORDER if (df.Stress_Level == s).any()],
            "academic_box": [_box(df[df.Academic_Level == s][TARGET], s) for s in ["High School", "Undergraduate", "Graduate"] if (df.Academic_Level == s).any()],
            "correlation": {"labels": [LABELS[c] for c in corr_cols], "matrix": [[_r(v, 2) for v in row] for row in corr.values]},
            # Columns with zero variance (e.g. Age for High School = always 18) have an undefined correlation -> null
            "constant_features": [LABELS[c] for c in corr_cols if df[c].nunique() <= 1],
            "target_corr": [{"label": LABELS[k], "value": _r(v, 3)} for k, v in with_target.items()],
            "scatter": {k: [[_r(x, 2), _r(y, 2)] for x, y in zip(sample[c], sample[TARGET])] for k, c in
                        {"usage": "Avg_Daily_Usage_Hours", "sleep": "Sleep_Hours_Per_Night", "unlocks": "Daily_Unlocks", "study": "Study_Hours"}.items()},
            "trends": {"physical": _trend(df, "Physical_Activity_Hours", 10), "study": _trend(df, "Study_Hours", 10), "unlocks": _trend(df, "Daily_Unlocks", 10)},
            "stress_counts": [{"label": s, "count": int((df.Stress_Level == s).sum())} for s in STRESS_ORDER],
            "gender": _group(df, "Gender"), "academic": _group(df, "Academic_Level"),
            "platform": _group(df, "Most_Used_Platform"), "purpose": _group(df, "Purpose_Of_Use"),
            "country": _group(df, "Country", top=12),
            "heatmap": {"rows": rows, "cols": cols, "values": [[_r(v, 2) for v in r] for r in vals]},
            "describe": [{"feature": LABELS[c], "mean": _r(r["mean"], 2), "std": _r(r["std"], 2), "min": _r(r["min"], 2), "q25": _r(r["25%"], 2), "median": _r(r["50%"], 2), "q75": _r(r["75%"], 2), "max": _r(r["max"], 2)} for c, r in desc.iterrows()],
        }
