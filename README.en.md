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

### Backend (designed, not included in code package)

- FastAPI + uvicorn (port 8000)
- SQLite (lightweight, suitable for single-league scenarios)
- ML model: `prediction_model.pkl` (scikit-learn)

### Project Structure

```
src/
├── app.tsx              # App entry & routing
├── components/          # Shared components
│   ├── Header.tsx
│   ├── Layout.tsx
│   └── ui/              # shadcn/ui components (30+)
├── pages/               # Four main pages
│   ├── Home/            # Home (fixtures, league table, AI prediction)
│   ├── Lineup/          # Lineup / Match Management (admin role)
│   ├── Social/          # Meetups
│   └── Profile/         # Profile (role switch, fitness, post-match thoughts)
└── ...
```

124 files total, 80+ source files.

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

- Node.js ≥ 18
- npm / pnpm / yarn

### Install & Run

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### Environment Variables

AI capabilities require an LLM API key (optional — falls back to mock data when not configured):

```
# .env
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
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

- ✅ Frontend four pages implemented (React + TS, 124 files)
- ✅ PRD V1.1 complete (To-be design doc, under review)
- ✅ ML prediction model experiment complete (standalone report)
- 🚧 Backend (FastAPI) is in design phase, code not included in deliverables
- 🚧 AI generation capabilities are partially mock / frontend templates, not connected to real LLM
- 🚧 Match prediction ML model is trained but not integrated into the frontend

> The core value of this project lies in: complete product design thinking (PRD + three-role permissions + AI-First architecture) + rigorous ML experiment methodology (14-method comparison + honest limitation analysis), rather than full production deployment.

---

## 📄 License

MIT
