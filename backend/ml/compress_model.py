"""Shrink the pickled pipeline (~186 MB -> ~38 MB) without changing a single prediction.

    python -m ml.compress_model            # rewrites artifacts/Mental_Health_ExtraTrees_Model.pkl in place

joblib.load() reads compressed and uncompressed files transparently, so no other code changes.
The smaller file fits under GitHub's 100 MB limit, so deployment needs no Git LFS.
"""
import sys
from pathlib import Path

import joblib

PATH = Path(__file__).resolve().parents[1] / "artifacts" / "Mental_Health_ExtraTrees_Model.pkl"

if __name__ == "__main__":
    before = PATH.stat().st_size / 1e6
    joblib.dump(joblib.load(PATH), PATH, compress=("zlib", 3))
    print(f"{before:.0f} MB -> {PATH.stat().st_size / 1e6:.0f} MB", file=sys.stderr)
