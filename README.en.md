# ⚽ Football AI Assistant

> An all-in-one management tool for amateur football leagues — covering fixtures, league tables, lineups, card tracking, and meetup coordination, with an AI layer for match predictions, tactical analysis, lineup recommendations, and post-match reviews.

**AI-First, not AI-Native**: Remove the LLM, and the core business (fixtures / league table / lineups / cards / meetups) still runs fully. AI capabilities are a high-value enhancement layer.

---

## 🎯 Product Positioning

In campus and amateur football, fixture information is scattered across WeChat groups, QQ groups, and spreadsheets. Fixture entry, league table maintenance, card accumulation, and suspension tracking are all manual. This project consolidates these workflows into one platform, then layers AI capabilities on top to lower the barrier for pre-match preparation and post-match analysis.

### Three User Roles

| Role | Typical User | Core Needs |
|------|-------------|------------|
| Player | Team member | View fixtures & league table, receive lineup notifications, report fitness status, submit post-match thoughts, join meetup sign-ups |
| Captain | Team captain / manager | Build starting lineups, check player fitness & suspensions, get AI lineup recommendations, write post-match reviews |
| League Admin | Organizer / referee group | Enter fixtures, record match results, manage card suspensions, publish match reports, view team overviews |

One account can hold different roles across multiple teams. Role switching changes only the current viewing perspective — not data ownership.

---

## ✨ Core Features

### Core Business Layer (runs fully without AI)

- **Fixture Management**: fixture entry, match result recording, automatic league table calculation
- **Lineup Builder**: captain builds starting lineup, players receive notifications
- **Cards & Suspensions**: automatic yellow/red card accumulation, automatic suspension status updates — no manual tracking
- **Meetup Coordination**: team meetups, sign-up sheets, headcount tracking
- **Notifications**: lineup pushes, post-match thought invitations, meetup notifications, unread badges
- **Three-Role Permission Isolation**: player / captain / league admin, with permission checks centralized in the service layer

### AI Capability Layer (high-value enhancement)

| Capability | Type | Description |
|-----------|------|-------------|
| Match Prediction | Prediction | Custom ML model (not LLM), 14 methods compared, 76.4% training accuracy |
| Pre-Match Tactical Guide | Generation | Tactical suggestions based on both teams' historical data |
| Lineup Recommendation | Generation | Recommends starting XI based on player fitness, suspensions, and history |
| Post-Match Review | Generation | Auto-generated match review summary |
| Match Report | Generation | One-click match report for league admins |
| Fixture File Parser | Generation | Upload fixture file, auto-parse and enter |

> **Technical Decision**: Match prediction uses a custom ML model rather than an LLM because prediction tasks require reproducible, well-calibrated, interpretable probability outputs. LLMs show non-reproducible blind-test results and poor probability calibration in this scenario (see ML experiment report).

---

## 🛠 Tech Stack

### Frontend

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build | Vite | 8 |
| Styling | Tailwind CSS | 4.2 |
| Component Library | shadcn/ui (Radix UI) | — |
| Routing | react-router-dom | 7.13 |
| Data Viz | ECharts + echarts-for-react | 5.6 |
| Animation | framer-motion + GSAP | 12.38 / 3.15 |
| Forms | react-hook-form + zod | 7.72 / 4.3 |
| Icons | lucide-react | 0.577 |

### Backend (shipped with this repo, FastAPI)

- FastAPI + uvicorn (port 8000), entrypoint `backend/run.py`, app object `backend/app/main.py`
- SQLite: `backend/data/football.db` (427 real match records, imported via `backend/scripts/import_season_records.py`)
- Score prediction: `backend/app/services/prediction.py` — a three-class Softmax regression (`backend/app/services/softmax_model.py`, pure-Python, zero extra dependencies). Model file `backend/models/prediction_model.pkl` is produced by `backend/scripts/train_model.py`; when missing or when inference fails it falls back to a heuristic (points / goal difference / home advantage / suspensions)
- Identity is simulated via request headers `X-User-Id` / `X-User-Role` (no auth system in this prototype)
- Tests: `backend/tests/` (pytest)
- LLM config: `backend/.env` (`AI_MODE` / `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`); AI generation features degrade to built-in templates when unset

### Project Structure

```
football-ai-assistant/
├── src/                        # Frontend (React 19 + TS + Tailwind 4 + shadcn/ui)
│   ├── app.tsx                 # Routes
│   ├── components/             # Shared components (Header / Layout / ui)
│   ├── pages/                  # Four main pages
│   │   ├── HomePage/           # Fixtures, league table, AI prediction
│   │   ├── LineupPage/         # Lineup / Match Management (association role)
│   │   ├── SocialPage/         # Meetups
│   │   └── ProfilePage/        # Profile
│   ├── lib/
│   │   ├── api.ts              # Backend API client (single data entry point)
│   │   └── mappers.ts          # snake_case -> frontend type mapping
│   └── data/                   # Type definitions & fallback data
├── backend/
│   ├── app/
│   │   ├── routers/            # 10 route modules (ai / matches / lineup / social ...)
│   │   ├── services/           # Business services (prediction / generators / llm ...)
│   │   ├── models.py           # SQLAlchemy models
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── scripts/                # Training & data import scripts
│   ├── tests/                  # pytest smoke tests
│   ├── data/                   # SQLite database (not versioned)
│   └── models/                 # Trained pkl artifacts (not versioned)
├── docs/                       # PRD, ML experiment report, design diagrams
├── football_ml_experiment.ipynb# Reproducible ML experiment notebook
├── docker-compose.yml          # One-command Docker deploy (frontend 8080 / backend 8000)
├── Dockerfile.frontend         # Frontend multi-stage image (Vite build + nginx proxy)
├── Dockerfile.backend          # Backend image
└── nginx.conf                  # nginx reverse proxy & SPA fallback config
```

---

## 📊 ML Experiment Highlights

The match prediction model was trained and evaluated in a rigorous standalone experiment report. Key findings:

| Metric | Value |
|--------|-------|
| Raw match data | 427 matches |
| Valid samples | 336 matches (both teams have ≥ 3 historical matches) |
| Sample dropout rate | 21.1% (91 matches excluded due to insufficient data) |
| Methods compared | 14 (logistic regression, random forest, XGBoost, MLP, Poisson model, etc.) |
| Best model training accuracy | 76.4% |
| Probability calibration Brier Score | 0.138 |
| Probability calibration ECE | 0.123 |

**Methodological rigor**:
- Confusion matrix + McNemar's test (significance between methods)
- Permutation test (whether results are random)
- Probability calibration curves (Brier / ECE)
- Poisson score model (predicts not just win/loss but also scorelines)
- Sample dropout analysis (reasons and impact of 91 excluded matches)

**Honest limitations** (explicitly acknowledged in the report):
- Three-class (win/draw/loss) model fails to learn draws — draw samples are few and features are indistinct; the model tends to predict win/loss
- Extrapolation failure — predictions are unreliable for teams with insufficient head-to-head history
- LLM blind-test non-reproducibility — LLM prediction results are inconsistent across repeated tests, unsuitable for scenarios requiring reproducibility
- 76.4% training accuracy ≠ generalization — test-set performance should be interpreted cautiously

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18, npm
- Python ≥ 3.11 (backend)
- Or Docker + Docker Compose

### Option 1: Docker one-command deploy (recommended)

```bash
# Configure the LLM (optional; without it AI generation falls back to built-in templates)
cp .env.example .env   # edit .env and fill in LLM_API_KEY etc.

docker compose up -d
```

Open <http://localhost:8080>. nginx reverse-proxies `/api` to the backend container, so the frontend never needs the backend address.

### Option 2: Local frontend/backend split

```bash
# --- Backend (port 8000) ---
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows; macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional, LLM config
python run.py

# --- Frontend (port 8001) ---
npm install
npm run dev:win
```

> ⚠️ **Known issue**: `API_BASE` in `src/lib/api.ts` is hardcoded to `http://localhost:8010/api`. That value is only rewritten to the relative path `/api` during the Docker build by `Dockerfile.frontend`. In local split development the frontend will call port 8010 while the backend actually listens on 8000 — you need to add a `server.proxy` entry in `vite.config.ts` forwarding `/api` to `http://localhost:8000`, or make `API_BASE` read from an env var. Not yet fixed.

### Environment Variables

Backend AI config (`backend/.env`, optional; degrades to mock / built-in templates when unset):

```
AI_MODE=auto
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

> Without an API key, AI generation capabilities return mock data. Core business features are unaffected.

---

## 📁 Related Documents

| Document | Description |
|----------|-------------|
| `Football AI Assistant PRD V1.1.docx` | Full PRD (To-be design doc, 628 paragraphs, incl. permission matrix, feature specs, acceptance criteria) |
| `Match Data ML Prediction Experiment Report.html` | Complete experiment report for ML model training & evaluation |
| `Match Records Summary.xlsx` | 427 raw match records |
| `Football AI Diagrams/` | Architecture diagram, ER diagram, data flow diagram, etc. |

---

## ⚠️ Project Status

This is a course design project. Current status:

- ✅ Frontend four pages implemented (React 19 + TS, all data fetched from the backend via `lib/api.ts`)
- ✅ Backend FastAPI fully shipped: 10 route modules, three-role permissions, SQLite with real match data, pytest smoke tests
- ✅ Docker one-command deploy (frontend nginx on 8080 with reverse proxy / backend on 8000)
- ✅ Score prediction uses an in-house Softmax regression trained by `backend/scripts/train_model.py`, not an LLM
- 🚧 AI generation features (tactics / lineup recommendation / post-match review) fall back to built-in templates when no API key is configured; switch to a real LLM once configured
- 🚧 `prediction_model.pkl` is not versioned — after cloning, run `cd backend && python scripts/train_model.py` to produce a local model, otherwise the heuristic fallback is used
- 🚧 In local split development the frontend API base URL and backend port are inconsistent (see the known issue under Quick Start)

> The core value of this project lies in: complete product design thinking (PRD + three-role permissions + AI-First architecture) + rigorous ML experiment methodology (14-method comparison + honest limitation analysis), rather than full production deployment.

---

## 📄 License

MIT
