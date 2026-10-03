"""Dataset loading + cleaning (mirrors section 4 of the notebook)."""
from pathlib import Path

import pandas as pd


def load_clean(csv_path: Path) -> tuple[pd.DataFrame, dict]:
    """Return the cleaned dataframe and a small data-quality report."""
    raw = pd.read_csv(csv_path)
    report = {
        "raw_rows": int(len(raw)),
        "columns": int(raw.shape[1]),
        "missing_values": int(raw.isnull().sum().sum()),
        "duplicates_removed": int(raw.duplicated().sum()),
        "negative_activity_clipped": int((raw["Physical_Activity_Hours"] < 0).sum()),
    }
    df = raw.drop_duplicates().copy()
    df["Physical_Activity_Hours"] = df["Physical_Activity_Hours"].clip(lower=0)
    report["clean_rows"] = int(len(df))
    return df.reset_index(drop=True), report
