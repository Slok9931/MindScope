/* Documentation content. Block types: p | code | list | table | why | info | warn | tip */
const code = (title, src, lang = "python") => ({ t: "code", title, lang, src });

export const GROUPS = [
  { title: "Overview", ids: ["overview"] },
  { title: "Machine learning", ids: ["libraries", "loading", "eda", "cleaning", "features", "split", "preprocessing", "metrics", "linear", "forest", "extra", "comparison", "cv", "importance", "errors", "saving"] },
  { title: "Application", ids: ["backend", "frontend", "run"] },
];

export const SECTIONS = [
  {
    id: "overview", title: "Project overview & architecture", tag: "Start here",
    summary: "What the app does, how the folders are organised and how a request travels from the browser to the model.",
    blocks: [
      { t: "p", text: "**MindScope** predicts a student's *Mental_Health_Score* (0–10, higher = better) from social-media habits, lifestyle and demographics. It is a classic **tabular regression** problem on 5,000 survey rows (4,998 after cleaning) and 12 input features." },
      { t: "p", text: "The repository is split into three independent parts so each can be tested, deployed and reasoned about on its own:" },
      code("Folder structure", `mental-health-insights/
├── notebooks/ML_Project_Improved.ipynb   # original research notebook
├── backend/                              # Python · FastAPI
│   ├── app/
│   │   ├── main.py                       # app factory, lifespan, SPA hosting
│   │   ├── core/config.py                # typed settings (paths, CORS) via pydantic-settings
│   │   ├── schemas/prediction.py         # request / response contracts + validation
│   │   ├── services/                     # business logic (no HTTP knowledge)
│   │   │   ├── analytics.py              #   EDA payloads for the Analysis page
│   │   │   ├── predictor.py              #   model loading, uncertainty, what-if curves
│   │   │   └── registry.py               #   serves metrics.json from training
│   │   └── api/                          # thin HTTP layer
│   │       ├── deps.py · router.py
│   │       └── routes/{analysis,models,predict}.py
│   ├── ml/                               # training code shared with serving
│   │   ├── features.py · data.py · pipelines.py
│   │   └── train.py                      # python -m ml.train  → artifacts/metrics.json
│   ├── data/raw/…csv   artifacts/…pkl + metrics.json
│   └── tests/test_api.py
└── frontend/                             # React 18 + Vite
    └── src/
        ├── api/client.js                 # the only place that calls fetch()
        ├── hooks/                        # useAsync, useDebounced, useClickOutside
        ├── lib/                          # scales, theme tokens
        ├── components/{ui,charts,layout}/# hand-built design system
        ├── pages/{analysis,models,predict,docs}/
        └── content/docs.js               # this documentation`, "text"),
      { t: "why", title: "Why this structure?", text: "Routes only translate HTTP ↔ Python, **services** hold the logic and know nothing about FastAPI, and **ml/** is imported by both the training script and the API. That removes the classic bug where the feature list used for training silently differs from the one used for serving." },
      { t: "table", head: ["Layer", "Responsibility", "Key file"], rows: [
        ["Browser", "Render pages, collect inputs, draw charts", "frontend/src/pages/*"],
        ["HTTP API", "Validate JSON, call services, return JSON", "backend/app/api/routes/*"],
        ["Services", "Compute analytics, run the model", "backend/app/services/*"],
        ["Artifacts", "Frozen scikit-learn pipeline + metrics", "backend/artifacts/*"],
      ] },
    ],
  },
  {
    id: "libraries", title: "1 · Importing libraries", tag: "Notebook §1",
    summary: "Every import has a job: data handling, preprocessing, models, metrics and persistence.",
    blocks: [
      code("imports", `import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.inspection import permutation_importance
import joblib`),
      { t: "list", items: [
        "**ColumnTransformer + Pipeline** apply different preprocessing to different column groups and chain it with the model into one object.",
        "**OneHotEncoder / OrdinalEncoder** convert text categories to numbers in two different, appropriate ways (see section 5).",
        "**KFold + cross_val_score** give a second opinion on model quality beyond one split.",
        "**permutation_importance** explains the model in a way that is unbiased for high-cardinality features.",
        "**joblib** is the standard way to persist scikit-learn objects that contain large NumPy arrays (it is faster than plain pickle).",
      ] },
    ],
  },
  {
    id: "loading", title: "2 · Loading & inspecting the data", tag: "Notebook §2",
    summary: "First look at shape, types, missing values and duplicates before touching anything.",
    blocks: [
      code("load.py", `df = pd.read_csv("Student Social Media And Mental Health Impact.csv")

print("Shape:", df.shape)            # (5000, 13)
display(df.head())
display(df.describe(include="all").T)

print("Missing values:")
display(df.isnull().sum())           # 0 – nothing to impute in this dataset
print("Duplicate rows:", df.duplicated().sum())   # 2
display(df.dtypes)`),
      { t: "why", title: "Why inspect first?", text: "Every later decision depends on this: no missing values means imputers are only a safety net; 2 duplicates and 10 negative hours tell us exactly what cleaning is needed; 111 unique countries tells us the encoding strategy matters." },
    ],
  },
  {
    id: "eda", title: "3 · Exploratory data analysis", tag: "Notebook §3",
    summary: "Four plots that explain the problem: the target distribution, the effect of stress, correlations and the two strongest habits.",
    blocks: [
      code("eda.py", `fig, axes = plt.subplots(1, 2, figsize=(13, 4))
sns.histplot(df["Mental_Health_Score"], kde=True, ax=axes[0])
sns.boxplot(data=df, x="Stress_Level", y="Mental_Health_Score",
            order=["Low", "Medium", "High", "Very High"], ax=axes[1])

numeric_cols_for_corr = df.select_dtypes(include="number").columns
sns.heatmap(df[numeric_cols_for_corr].corr(), annot=True, fmt=".2f", cmap="coolwarm")

sns.scatterplot(data=df, x="Avg_Daily_Usage_Hours", y="Mental_Health_Score")
sns.scatterplot(data=df, x="Sleep_Hours_Per_Night",  y="Mental_Health_Score")`),
      { t: "list", items: [
        "**Histogram of the target** shows whether it is skewed or multi-modal — it decides if a log-transform or a different loss might be needed (it is close to bell-shaped, so no).",
        "**Box-plot by stress** reveals a strong ordered effect, which justifies encoding stress as an *ordinal* number rather than one-hot.",
        "**Correlation heat-map** ranks linear relationships: usage (−0.82), unlocks (−0.79), sleep (+0.77), study (+0.75).",
        "**Scatter plots** check that those relationships are roughly linear and have no strange outliers.",
      ] },
      { t: "info", title: "See it live", text: "The Data Analysis page re-creates these plots (and many more) from the API, with filters for gender and academic level." },
    ],
  },
  {
    id: "cleaning", title: "4 · Data cleaning", tag: "Notebook §4",
    summary: "Drop exact duplicates and fix physically impossible values.",
    blocks: [
      code("clean.py", `df = df.drop_duplicates().copy()
df["Physical_Activity_Hours"] = df["Physical_Activity_Hours"].clip(lower=0)

print("Shape after cleaning:", df.shape)                      # (4998, 13)
print("Minimum physical activity hours:", df["Physical_Activity_Hours"].min())  # 0.0`),
      { t: "why", title: "Why clip instead of drop?", text: "Ten rows had *negative* hours of physical activity, which is impossible — but the rest of each row is valid. Clipping to 0 keeps 10 good samples; dropping them would throw away information. Duplicates are dropped because a repeated row would appear in both the train and the test set and inflate the score (leakage)." },
    ],
  },
  {
    id: "features", title: "5 · Defining features & target", tag: "Notebook §5",
    summary: "Numeric, ordinal and nominal columns each get their own treatment — and all 111 countries are kept.",
    blocks: [
      code("features.py", `target = "Mental_Health_Score"

numeric_features = ["Age", "Avg_Daily_Usage_Hours", "Daily_Unlocks",
                    "Study_Hours", "Sleep_Hours_Per_Night", "Physical_Activity_Hours"]

ordinal_features = ["Stress_Level"]
ordinal_order    = [["Low", "Medium", "High", "Very High"]]

nominal_features = ["Gender", "Academic_Level", "Most_Used_Platform",
                    "Purpose_Of_Use", "Country"]

feature_columns = numeric_features + ordinal_features + nominal_features
X = df[feature_columns]
y = df[target]`),
      { t: "table", head: ["Type", "Columns", "Encoding", "Reason"], rows: [
        ["Numeric", "6 columns", "none (scaled for linear only)", "Already numbers with real magnitudes"],
        ["Ordinal", "Stress_Level", "Low=0 … Very High=3", "Categories have a natural order the model can exploit"],
        ["Nominal", "5 columns", "One-hot", "No order — integers would invent a false ranking"],
      ] },
      { t: "why", title: "Why keep all 111 countries?", text: "The first version of the project collapsed 101 countries into “Other”. That assumed country carries little signal, but it is the third most important feature (see permutation importance). With ~5,000 rows there is enough data to one-hot encode all of them, and doing so lifted Extra Trees to R² 0.942 — while `handle_unknown='ignore'` keeps the model safe if a new country ever appears." },
    ],
  },
  {
    id: "split", title: "6 · Train / test split", tag: "Notebook §6",
    summary: "70 % to learn from, 30 % kept untouched for an honest final grade.",
    blocks: [
      code("split.py", `X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, random_state=42
)
print("Training rows:", len(X_train))   # 3498
print("Testing rows:",  len(X_test))    # 1500`),
      { t: "why", title: "Why this split?", text: "A model graded on data it has already seen only measures memory. The 1,500 test rows are never used for fitting or tuning. `random_state=42` makes the split reproducible, and keeping the *same* split as the original notebook means improvements are compared fairly." },
    ],
  },
  {
    id: "preprocessing", title: "7 · Preprocessing pipelines", tag: "Notebook §7",
    summary: "One preprocessor for the linear model (scaled) and one for the trees (unscaled).",
    blocks: [
      code("preprocessing.py", `linear_preprocessor = ColumnTransformer(transformers=[
    ("num", Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler())
    ]), numeric_features),
    ("stress", Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(categories=ordinal_order,
                                   handle_unknown="use_encoded_value", unknown_value=-1))
    ]), ordinal_features),
    ("cat", Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ]), nominal_features)
])

tree_preprocessor = ColumnTransformer(transformers=[
    ("num", SimpleImputer(strategy="median"), numeric_features),   # no scaler!
    ("stress", Pipeline([...same as above...]), ordinal_features),
    ("cat",    Pipeline([...same as above...]), nominal_features)
])`),
      { t: "why", title: "Why two preprocessors?", text: "Linear regression is sensitive to feature scale (coefficients and optimisation), so numerics are standardised. Decision trees only compare values against thresholds, so any monotonic rescaling gives *identical* trees — scaling is wasted work and makes the saved model harder to inspect." },
      { t: "tip", title: "Imputers when there are no missing values?", text: "They never fire on this dataset, but they make the saved pipeline robust: if the API ever receives a null, it is filled with the training median / most frequent value instead of crashing." },
      { t: "p", text: "Fitting every transformer **inside** the pipeline means they only learn statistics (means, categories) from training folds. Doing `StandardScaler().fit(X)` on the whole dataset first would leak test information into training." },
    ],
  },
  {
    id: "metrics", title: "8 · Evaluation helper & metrics", tag: "Notebook §8",
    summary: "R², MAE and RMSE — three complementary views of regression quality.",
    blocks: [
      code("evaluate.py", `def evaluate_model(name, pipeline, X_train, y_train, X_test, y_test):
    pipeline.fit(X_train, y_train)
    train_pred = pipeline.predict(X_train)
    test_pred  = pipeline.predict(X_test)
    return {
        "Model": name,
        "Training R²": r2_score(y_train, train_pred),
        "Test R²":     r2_score(y_test,  test_pred),
        "MAE":  mean_absolute_error(y_test, test_pred),
        "RMSE": np.sqrt(mean_squared_error(y_test, test_pred)),
        "Pipeline": pipeline,
    }, test_pred`),
      { t: "table", head: ["Metric", "Meaning", "Why it is used"], rows: [
        ["R²", "Fraction of variance explained (1 = perfect, 0 = predicting the mean)", "Scale-free, easy to compare across models"],
        ["MAE", "Average absolute miss in score points", "Directly interpretable: “off by 0.23 on a 10-point scale”"],
        ["RMSE", "Square-root of mean squared error", "Punishes big misses harder than MAE"],
      ] },
      { t: "warn", title: "R² is not “accuracy”", text: "Accuracy is a classification metric. Calling R² accuracy (as the original notebook did) is misleading; this project reports R², MAE and RMSE by name. Training vs. test R² is also returned so over-fitting is visible." },
    ],
  },
  {
    id: "linear", title: "9 · Baseline: Linear Regression", tag: "Notebook §9",
    summary: "The simplest sensible model — everything else must beat it to be worth the complexity.",
    blocks: [
      code("linear.py", `lr_pipeline = Pipeline([
    ("preprocessor", linear_preprocessor),
    ("regressor",    LinearRegression())
])
lr_result, lr_pred = evaluate_model("Linear Regression", lr_pipeline,
                                    X_train, y_train, X_test, y_test)`),
      { t: "p", text: "Result: **test R² 0.787, MAE 0.478, RMSE 0.612.** Train and test R² are almost equal (0.781 vs 0.787), so the model is under-fitting rather than over-fitting: the relationships in this data are not purely additive and linear." },
      { t: "why", title: "Why start here?", text: "A baseline gives context. 0.787 is already decent, so any complex model has to justify itself with a clear margin — and it did." },
    ],
  },
  {
    id: "forest", title: "10 · Random Forest", tag: "Notebook §10",
    summary: "Averaging 300 de-correlated trees captures interactions the linear model cannot.",
    blocks: [
      code("random_forest.py", `rf_pipeline = Pipeline([
    ("preprocessor", tree_preprocessor),
    ("regressor", RandomForestRegressor(
        n_estimators=300,      # more trees → lower variance, diminishing returns after ~300
        max_features=1.0,      # consider all features at each split
        random_state=42,       # reproducible
        n_jobs=-1              # use every CPU core
    ))
])`),
      { t: "p", text: "Result: **test R² 0.912, MAE 0.286, RMSE 0.393** (train R² 0.987). Big jump over linear, but the 0.075 gap between train and test shows it memorises some noise." },
      { t: "why", title: "Why a forest?", text: "Each tree is a high-variance learner; averaging many trees trained on different bootstrap samples cancels the noise while keeping the low bias. It handles interactions (“long usage hurts more when sleep is short”) automatically." },
    ],
  },
  {
    id: "extra", title: "11 · Extra Trees — the final model", tag: "Notebook §11",
    summary: "Even more randomness gives smoother predictions and the best score.",
    blocks: [
      code("extra_trees.py", `et_pipeline = Pipeline([
    ("preprocessor", tree_preprocessor),
    ("regressor", ExtraTreesRegressor(
        n_estimators=300,
        max_features=0.8,      # each split looks at a random 80 % of the features
        min_samples_leaf=1,    # fully grown trees; averaging controls variance
        random_state=42,
        n_jobs=-1
    ))
])`),
      { t: "p", text: "Result: **test R² 0.942, MAE 0.228, RMSE 0.319.** Training R² is 1.000 because trees are grown fully, but the test score is the best of all three — averaging 300 randomised trees keeps the variance low." },
      { t: "why", title: "Why Extra Trees beat Random Forest here", text: "Random Forest searches for the *best* threshold at every split, which can chase noise. Extra Trees draws thresholds at random and keeps only the best of those, acting like regularisation. It also trains on the full data (no bootstrap), so every tree sees all rows. On a smooth target such as this one, that extra smoothing pays off (+0.03 R²)." },
      { t: "warn", title: "Training R² = 1.0 is not a bug", text: "It simply reflects deep unpruned trees on seen data. Judge the model by test R² and cross-validation, never by training score." },
    ],
  },
  {
    id: "comparison", title: "12 · Model comparison", tag: "Notebook §12",
    summary: "Side-by-side results on the identical hold-out set.",
    blocks: [
      code("compare.py", `results = pd.DataFrame([lr_result, rf_result, et_result])
results = results.drop(columns="Pipeline").sort_values("Test R²", ascending=False)
display(results)

sns.barplot(data=results, x="Test R²", y="Model")
plt.xlim(0, 1)`),
      { t: "table", head: ["Model", "Train R²", "Test R²", "MAE", "RMSE"], rows: [
        ["Extra Trees", "1.0000", "0.9421", "0.2275", "0.3188"],
        ["Random Forest", "0.9866", "0.9122", "0.2856", "0.3928"],
        ["Linear Regression", "0.7805", "0.7871", "0.4779", "0.6115"],
      ] },
      { t: "info", title: "Interactive version", text: "Open the Models page for interactive charts, per-model details, residual plots and the full training timeline." },
    ],
  },
  {
    id: "cv", title: "13 · Cross-validation", tag: "Notebook §13",
    summary: "Five different train/validation splits confirm the ranking is not luck.",
    blocks: [
      code("cv.py", `cv = KFold(n_splits=5, shuffle=True, random_state=42)

cv_models = {"Linear Regression": lr_pipeline,
             "Random Forest": rf_pipeline,
             "Extra Trees": et_pipeline}

for name, model in cv_models.items():
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="r2", n_jobs=1)
    print(name, scores.mean().round(4), "±", scores.std().round(4))`),
      { t: "table", head: ["Model", "CV mean R²", "Observation"], rows: [
        ["Extra Trees", "0.9189", "Highest and most stable"],
        ["Random Forest", "0.8920", "~0.03 behind"],
        ["Linear Regression", "0.7731", "Consistent but limited"],
      ] },
      { t: "why", title: "Why CV on the training set only?", text: "The test set must stay untouched so it can serve as the final, unbiased exam. CV scores are a little lower than the test score because each fold trains on just 80 % of the training rows. `shuffle=True` matters because the CSV may be ordered." },
    ],
  },
  {
    id: "importance", title: "14 · Feature importance", tag: "Notebook §14",
    summary: "Permutation importance tells us what the model actually relies on.",
    blocks: [
      code("importance.py", `best_model = et_result["Pipeline"]

perm = permutation_importance(
    best_model, X_test, y_test,
    n_repeats=10, random_state=42, scoring="r2", n_jobs=-1
)
importance = pd.DataFrame({
    "Feature": X_test.columns,
    "Importance": perm.importances_mean,
    "Std": perm.importances_std
}).sort_values("Importance", ascending=False)`),
      { t: "p", text: "For Extra Trees the ranking is **daily usage (0.247) → sleep (0.208) → country (0.178) → stress (0.079) → unlocks (0.078) → platform (0.041)**." },
      { t: "why", title: "Why permutation instead of feature_importances_?", text: "Impurity-based importance is biased towards features with many possible split points (like a 111-level country one-hot or continuous variables). Permutation importance shuffles one *original* column on the test set and measures how much R² drops — it is model-agnostic, uses unseen data and works on the raw columns (so “Country” is one number, not 111)." },
    ],
  },
  {
    id: "errors", title: "15 · Prediction error analysis", tag: "Notebook §15",
    summary: "Where does the model miss, and is the error random or systematic?",
    blocks: [
      code("errors.py", `error_df = X_test.copy()
error_df["Actual"]    = y_test.values
error_df["Predicted"] = et_pred
error_df["Error"]     = error_df["Actual"] - error_df["Predicted"]
error_df["Absolute_Error"] = error_df["Error"].abs()

display(error_df.sort_values("Absolute_Error", ascending=False).head(10))

sns.scatterplot(x=y_test, y=et_pred, alpha=0.5)       # actual vs predicted
plt.plot([min_v, max_v], [min_v, max_v], linestyle="--")   # perfect-prediction line`),
      { t: "why", title: "Why look at residuals?", text: "A single R² can hide systematic problems. Points hugging the diagonal in the actual-vs-predicted plot, and a residual histogram centred on zero, show the errors are small and unbiased. Listing the worst rows reveals which kinds of students are hardest to predict." },
    ],
  },
  {
    id: "saving", title: "16 · Final model & saving", tag: "Notebook §16–17",
    summary: "Refit on all data and persist the whole pipeline, not just the trees.",
    blocks: [
      code("save.py", `final_model = et_pipeline
final_model.fit(X, y)                       # all 4,998 rows

joblib.dump(final_model, "Mental_Health_ExtraTrees_Model.pkl")

# inference accepts the same raw columns used in training
sample = pd.DataFrame([{ "Age": 21, "Avg_Daily_Usage_Hours": 4.0, "Daily_Unlocks": 55,
    "Study_Hours": 3.0, "Sleep_Hours_Per_Night": 7.0, "Physical_Activity_Hours": 1.0,
    "Stress_Level": "Medium", "Gender": "Male", "Academic_Level": "Undergraduate",
    "Most_Used_Platform": "Instagram", "Purpose_Of_Use": "Entertainment", "Country": "India" }])
final_model.predict(sample)                 # → 7.27`),
      { t: "why", title: "Why refit on everything?", text: "After model selection is finished, the test rows are no longer needed as a hold-out; adding 30 % more data gives a slightly better deployed model. The reported metrics come from the 70/30 experiment, so they remain honest." },
      { t: "warn", title: "Deployment gotchas", text: "Pickles are tied to the library version: this model was saved with **scikit-learn 1.6.1**, so `requirements.txt` pins that exact version (loading it with 1.8 fails). The raw file is ~186 MB (300 fully grown trees) and needs ~450 MB of RAM once loaded. `python -m ml.compress_model` shrinks it to ~38 MB with **identical predictions** — small enough for plain Git, no LFS needed." },
    ],
  },
  {
    id: "backend", title: "17 · Backend API (FastAPI)", tag: "Application",
    summary: "How the saved pipeline is served: validation, uncertainty, what-if curves and clean layering.",
    blocks: [
      { t: "table", head: ["Method & path", "Purpose"], rows: [
        ["GET /api/analysis/overview?gender=&academic_level=", "All chart data for the Analysis page (cached per filter)"],
        ["GET /api/analysis/options", "Categories + numeric ranges used to build the prediction form"],
        ["GET /api/models  ·  GET /api/models/{key}", "Leaderboard / full detail of one trained model"],
        ["POST /api/predict", "Score, likely range, percentile, warnings, what-if curves"],
        ["GET /api/health", "Liveness probe"],
      ] },
      code("app/main.py — load once at start-up", `@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.analytics = AnalyticsService(settings.dataset_path)
    app.state.predictor = Predictor(settings.model_path, app.state.analytics.reference)
    app.state.registry  = ModelRegistry(settings.metrics_path)
    yield`),
      { t: "why", title: "Why a lifespan hook?", text: "Unpickling a 186 MB model takes seconds. Doing it per request would make every call unusably slow; doing it once at start-up keeps a prediction at ~150 ms (including the 300-tree uncertainty band and 56 what-if predictions)." },
      code("app/schemas/prediction.py — validate before the model sees anything", `class PredictionRequest(BaseModel):
    Age: int = Field(ge=14, le=60)
    Avg_Daily_Usage_Hours: float = Field(ge=0, le=18)
    Stress_Level: Literal["Low", "Medium", "High", "Very High"]
    ...
    @model_validator(mode="after")
    def day_must_fit_in_24_hours(self):
        total = (self.Avg_Daily_Usage_Hours + self.Study_Hours
                 + self.Sleep_Hours_Per_Night + self.Physical_Activity_Hours)
        if total > 24:
            raise ValueError(f"... add up to {total:.1f} h, which is more than 24 h in a day.")
        return self`),
      code("app/services/predictor.py — uncertainty from the ensemble", `def _tree_spread(self, row):
    pre, reg = self.pipeline.named_steps["preprocessor"], self.pipeline.named_steps["regressor"]
    xt = np.ascontiguousarray(pre.transform(row).toarray(), dtype=np.float32)
    per_tree = np.array([t.predict(xt, check_input=False)[0] for t in reg.estimators_])
    return np.percentile(per_tree, 10), np.percentile(per_tree, 90)`),
      { t: "why", title: "Why a range and a what-if?", text: "A single number looks more certain than it is. The 10th–90th percentile of the 300 individual tree predictions is a cheap, honest indication of how much the ensemble disagrees. The what-if curves re-predict while sweeping one feature across its training range, which makes the model's learned behaviour visible. Out-of-range inputs raise a warning because tree models cannot extrapolate beyond the data they saw." },
      code("app/api/routes/predict.py", `@router.post("", response_model=PredictionResponse)
def predict(req: PredictionRequest, svc: Annotated[Predictor, Depends(get_predictor)]):
    if req.Country not in svc.valid_countries:
        raise HTTPException(422, f"Unknown country '{req.Country}'.")
    return svc.predict(req)`),
      { t: "tip", title: "Tests", text: "`backend/tests/test_api.py` checks that the API reproduces the notebook's example prediction (≈7.27), rejects a 28-hour day, rejects unknown countries and honours filters. Run `pytest` inside `backend/`." },
    ],
  },
  {
    id: "frontend", title: "18 · Frontend (React + hand-built UI kit)", tag: "Application",
    summary: "No component or chart libraries: every control and every plot is custom.",
    blocks: [
      { t: "p", text: "The UI deliberately avoids native form controls and chart libraries. Dropdowns, sliders, steppers, segmented controls, tabs, tables, code blocks and all eight chart types are written from scratch with React + SVG, sharing one design-token file (`styles/tokens.css`)." },
      { t: "table", head: ["Component", "What makes it custom"], rows: [
        ["Select", "Listbox with keyboard navigation, type-to-filter, scroll-into-view and ARIA roles"],
        ["Slider", "Pointer-capture dragging, keyboard support, shaded “seen in training” range, dataset-mean tick"],
        ["Segmented / Tabs", "A sliding thumb driven by a CSS variable (`--i`) rather than per-item backgrounds"],
        ["Charts", "Bar, histogram, box-plot, heat-map, scatter (with OLS fit), line, donut, gauge — each ~50 lines of SVG"],
        ["CodeBlock", "Regex tokenizer for syntax highlighting + copy button"],
      ] },
      code("components/ui/Slider.jsx — pointer-driven value", `const fromEvent = (e) => {
  const r = track.current.getBoundingClientRect();
  return snap(min + ((e.clientX - r.left) / r.width) * (max - min));
};
const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); onChange(fromEvent(e)); };
const move = (e) => { if (drag) onChange(fromEvent(e)); };`, "jsx"),
      { t: "why", title: "Why hand-roll charts?", text: "A tiny `linear()` scale and a `niceTicks()` helper cover everything the project needs, so the bundle stays small, the visuals match the design system exactly and animation/tooltips are fully controlled. Chart payloads are pre-computed by the API (histogram bins, box-plot quartiles, correlation matrix), so the browser only draws." },
      code("hooks/useAsync.js — stale responses are ignored", `export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setState({ data, error: null, loading: false }),
              (error) => alive && setState({ data: null, error, loading: false }));
    return () => { alive = false; };
  }, deps);
  return state;
}`, "jsx"),
      { t: "p", text: "The Prediction Lab debounces input changes (450 ms) and cancels in-flight requests with `AbortController`, so quickly dragging a slider never shows an out-of-date result." },
    ],
  },
  {
    id: "run", title: "19 · Running the project", tag: "Application",
    summary: "Local development, production build, retraining and tests.",
    blocks: [
      code("Backend", `cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# place Mental_Health_ExtraTrees_Model.pkl in backend/artifacts/
uvicorn app.main:app --reload --port 8000        # docs at http://localhost:8000/docs`, "bash"),
      code("Frontend (dev)", `cd frontend
npm install
npm run dev                                       # http://localhost:5173 (proxies /api → :8000)`, "bash"),
      code("Production — one process serves API + UI", `cd frontend && npm run build               # creates frontend/dist
cd ../backend && uvicorn app.main:app --port 8000   # open http://localhost:8000`, "bash"),
      code("Retrain & test", `cd backend
python -m ml.train                  # regenerates artifacts/metrics.json (≈1 min)
python -m ml.train --export-model   # also refits Extra Trees on all rows and overwrites the .pkl
pytest -q`, "bash"),
      code("Deploy (Render, one service)", `# repo root has Dockerfile + render.yaml
git push                       # then Render → New → Blueprint → pick the repo
# 2 GB plan required for the full model; health check: /api/health`, "bash"),
      { t: "info", title: "Configuration", text: "Paths and CORS origins can be overridden with environment variables prefixed `MHI_` (for example `MHI_MODEL_PATH`) or a `.env` file." },
    ],
  },
];
