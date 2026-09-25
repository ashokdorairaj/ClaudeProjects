# SAP Synthetic Data & Experiment Accelerator v2

A fully working demo of the SAP Enterprise Synthetic Data & Experiment Accelerator concept. Built on the v2 paper (September 2026).

**Demo company:** Northstar Manufacturing (fictional)  
**Status:** Working demo — all core flows are functional

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Recommended) Install Python ML dependencies for real XGBoost
pip install scikit-learn xgboost numpy

# 3. Start the dev server
npm run dev

# 4. Open the demo
# Navigate to: ⬡ Synthetic Data Accelerator v2 ✦ in the left sidebar
# Or go directly to: http://localhost:5173/?page=demo/fiori/synthetic-data-v2
```

---

## What is real vs. simulated

| Feature | Status | Notes |
|---|---|---|
| Data generation (10K BPs, 100K receivables) | ✅ Real | TypeScript, deterministic seed |
| Referential integrity (FK checks) | ✅ Real | Verified at runtime |
| Business rule validation | ✅ Real | 12 checks computed from data |
| Distribution comparison | ✅ Real | Actual vs. target rates |
| Rules baseline (predict late) | ✅ Real | F1/AUC computed from data |
| XGBoost / gradient boosting | ✅ Real (with Python) | Via Express → Python subprocess |
| XGBoost fallback (no Python) | ✅ Real (JS decision tree) | Labeled "JS Fallback" |
| RPT model | ⚠️ Simulated | Logistic regression proxy, clearly labeled |
| CSV download (per entity) | ✅ Real | Client-side Blob |
| ZIP download (all entities + metadata.json) | ✅ Real | Server-side adm-zip |
| Pack versioning (v1.0 → v1.1) | ✅ Real | State management |
| Schema source (FSCM, CDS) | 🎭 Demo only | SAP backend not connected |
| Real customer data | ❌ None | All fictional |

---

## Python Setup (for real XGBoost)

XGBoost training requires Python to be installed. If Python is not found, the demo falls back to a JavaScript decision tree automatically (labeled clearly in the UI).

### Check if Python is working

```bash
# Check health endpoint after npm run dev
curl http://localhost:5173/api/synthetic/health
```

Expected response with Python:
```json
{ "pythonAvailable": true, "xgboostAvailable": true, "pythonVersion": "3.x.x" }
```

### Install Python dependencies

```bash
# If using pip directly
pip install scikit-learn xgboost numpy

# If using a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install scikit-learn xgboost numpy
```

**Windows note:** Set the `PYTHON_BIN` environment variable if `python3` is not in your PATH:
```
set PYTHON_BIN=python
npm run dev
```

---

## Demo Walkthrough (5 minutes)

See `demo-script.md` for the full guided walkthrough.

### Quick flow

1. **Overview** — See 2 packs (Collections validated, Procurement draft) + flywheel
2. **Collections Pack** — View entity graph (BP → Receivable → Payment/Dunning/Dispute), click entities to inspect schemas
3. **Generate Data** — L1 (SAP Baseline): 2,000 BPs / 20,000 receivables. Or load Northstar profile for L3.
4. **Dataset Preview** — Browse entity tabs, download CSV or ZIP
5. **Quality Report** — FK integrity 100%, business rules, distribution comparison
6. **Experiment Lab** — Run Rules baseline, then XGBoost, then RPT adapter. See comparison table.
7. **Reusable Learnings** — Propose 3+ learnings for Pack v1.1
8. **Pack Versioning** — Validate v1.1 to complete the flywheel cycle

---

## Architecture

See `architecture.md` for full details.

**Frontend:** React 19 + @ui5/webcomponents-react 2.21 (Fiori design)  
**Backend:** Vite dev server with custom middleware plugin (`syntheticDataPlugin` in vite.config.ts)  
**ML:** Python subprocess (`server/ml_train.py`) with JS decision tree fallback  
**Data generation:** Pure TypeScript (`dataEngine.ts`) — deterministic mulberry32 PRNG, seed=42

---

## Known Limitations

1. **Performance:** Generating 50K+ receivables takes 2–5 seconds in the browser. The UI shows a progress indicator.
2. **RPT:** The RPT adapter uses logistic regression, not real SAP-RPT. This is clearly labeled throughout the UI.
3. **Schema source:** The pack references FSCM/CDS domain models conceptually, but no live SAP system is connected.
4. **L4 sample calibration:** The demo analyzes uploaded CSV files but does not implement full statistical calibration — it shows the analysis and uses it for display.
5. **ZIP download:** Requires the Vite dev server to be running (not available in static builds without Express).

---

## Project Structure

```
src/pages/demo/fiori/synthetic-data-v2/
├── index.tsx            # Root shell — all state, ShellBar, SideNavigation
├── types.ts             # All TypeScript interfaces
├── constants.ts         # Northstar config, pack definition, nav items
├── dataEngine.ts        # Deterministic data generation (mulberry32 PRNG)
├── qualityEngine.ts     # FK checks + business rule validation
├── rulesEngine.ts       # Rules baseline + metrics
├── rptEngine.ts         # RPT adapter (logistic regression, labeled simulated)
├── api.ts               # Express API client
├── views/               # 8 screen components
└── components/          # Shared Fiori sub-components

server/
├── syntheticData.cjs    # Express routes: /api/synthetic/*
└── ml_train.py          # Python XGBoost/HistGradientBoosting training script
```
