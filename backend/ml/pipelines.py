"""Preprocessing + model pipelines (mirrors sections 7, 9-11 of the notebook)."""
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

from ml.features import NOMINAL_FEATURES, NUMERIC_FEATURES, ORDINAL_FEATURES, ORDINAL_ORDER


def _stress_branch():
    return Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(categories=ORDINAL_ORDER, handle_unknown="use_encoded_value", unknown_value=-1)),
    ])


def _nominal_branch():
    return Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])


def linear_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), NUMERIC_FEATURES),
        ("stress", _stress_branch(), ORDINAL_FEATURES),
        ("cat", _nominal_branch(), NOMINAL_FEATURES),
    ])


def tree_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ("num", SimpleImputer(strategy="median"), NUMERIC_FEATURES),
        ("stress", _stress_branch(), ORDINAL_FEATURES),
        ("cat", _nominal_branch(), NOMINAL_FEATURES),
    ])


def build_pipelines() -> dict[str, Pipeline]:
    return {
        "linear_regression": Pipeline([("preprocessor", linear_preprocessor()), ("regressor", LinearRegression())]),
        "random_forest": Pipeline([
            ("preprocessor", tree_preprocessor()),
            ("regressor", RandomForestRegressor(n_estimators=300, max_features=1.0, random_state=42, n_jobs=-1)),
        ]),
        "extra_trees": Pipeline([
            ("preprocessor", tree_preprocessor()),
            ("regressor", ExtraTreesRegressor(n_estimators=300, max_features=0.8, min_samples_leaf=1, random_state=42, n_jobs=-1)),
        ]),
    }
