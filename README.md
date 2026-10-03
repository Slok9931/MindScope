# MindScope — Student Mental Health Insights

Full-stack ML app built on your notebook, dataset and Extra Trees model.

| Page | Route | What it shows |
|---|---|---|
| Data Analysis | `/analysis` | 20 live charts, gender / academic-level filters, data-quality report |
| Models | `/models` | Leaderboard, metric charts, CV, per-model explorer, pipeline diagram + training timeline |
| Prediction Lab | `/predict` | Custom form → live prediction, likely range, percentile, what-if curves |
| Documentation | `/docs` | Notebook + app code with the reasoning for each step |

## Quick start
```bash
# 1. backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt            # scikit-learn is pinned to 1.6.1 (the .pkl's version)
# the model is already in backend/artifacts/ (compressed to 38 MB, identical predictions)
uvicorn app.main:app --reload --port 8000  # API docs: http://localhost:8000/docs

# 2. frontend (dev, hot reload)
cd frontend && npm install && npm run dev  # http://localhost:5173

# 3. or production: one process serves API + UI
cd frontend && npm run build && cd ../backend && uvicorn app.main:app --port 8000
```
## Retrain / test
```bash
cd backend && python -m ml.train           # regenerates artifacts/metrics.json
python -m ml.train --export-model          # also refits + overwrites the .pkl
pytest -q                                  # API tests
cd ../frontend && npm test                 # smoke tests (needs the API running on :8000)
```
Config via env vars prefixed `MHI_` (see `backend/.env.example`).

## Deploy

> **Memory matters.** The full Extra Trees model needs ~450 MB RAM once loaded (~600 MB for the whole API), so **512 MB plans
> (Render Free/Starter) will run out of memory.** Use a 2 GB plan, or build a lighter model:
> `python -m ml.train --export-model --trees 150 --min-leaf 3` (~20 MB, test R² ≈ 0.92 instead of 0.94).

### Option A — Render only (recommended, one service serves API + UI)
1. Push this repo to GitHub (the 38 MB model fits without Git LFS).
2. Render dashboard → **New → Blueprint** → select the repo. `render.yaml` + `Dockerfile` do the rest.
   (Or **New → Web Service** → runtime **Docker**, instance type **Standard**, health check path `/api/health`.)
3. Open `https://<service>.onrender.com` once the build finishes.

### Option B — UI on Vercel, API on Render
Vercel cannot host the API (serverless size/memory limits are below scikit-learn + this model), so split them:
1. Deploy the API on Render as in Option A and copy its URL.
2. Vercel → **Add New → Project** → import the repo, set **Root Directory = `frontend`** (framework: Vite is auto-detected).
3. Vercel → Settings → Environment Variables: `VITE_API_URL = https://<service>.onrender.com` (no trailing slash), then deploy.
4. Render → Environment: `MHI_CORS_ORIGINS = ["https://<your-app>.vercel.app"]` (a JSON list), then redeploy the API.
`VITE_API_URL` is baked in at build time, so redeploy the frontend whenever it changes.
