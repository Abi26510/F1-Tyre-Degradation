# F1-Tyre-Degradation

> **"Why Did a Tyre Strategy Cost a Driver Time?"**  
> An interactive Formula 1 telemetry and statistical analysis platform exploring how lap times evolve as tyres age throughout a Grand Prix, isolating fuel weight burn-off and traffic dirty air to unmask true compound degradation.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Project Overview

During a Grand Prix, slower lap times during a stint don't automatically prove pure tyre degradation:
1. **Fuel Weight Burn-Off**: A modern Formula 1 car burns $\sim 1.5\text{kg}$ to $2.0\text{kg}$ of fuel per lap, naturally gaining speed ($\sim 0.035\text{s}$ to $0.060\text{s}$ per lap depending on circuit sensitivity). Without fuel correction, true compound degradation is heavily masked.
2. **Dirty Air & Aerodynamic Slip**: Running within $1.2\text{s}$ of another car sheds downforce and causes lateral micro-sliding, accelerating thermal degradation and surface blistering.
3. **Safety Cars & Neutralizations**: In-laps, out-laps, Virtual Safety Cars (VSC), and full Safety Cars (SC) introduce artificial pace distortions.

This platform implements an end-to-end data pipeline and split-pane web dashboard to answer:
- **How fast do Pirelli Soft, Medium, and Hard compounds degrade ($s/\text{lap}$)?**
- **At what tyre age does an alternate compound cross over to become faster?**
- **What aerodynamic, thermal, and mechanical factors make competitor teams' tyres last longer?**

---

## 🏗️ Architecture & Analytical Pipeline

```
[OpenF1 / FastF1 API] 
       │
       ▼
[1. Extraction & Caching Layer] ──> Raw Session & Telemetry Parquet Files (data/cache/)
       │
       ▼
[2. Cleaning & Flag Filtering]  ──> Drop In/Out laps, SC/VSC, Red Flags, Traffic (<1.2s)
       │
       ▼
[3. Feature Correction Engine]  ──> Fuel Effect (~0.045s/lap) & Track Evolution
       │
       ▼
[4. Statistical Degradation Engine] ──> Compound Wear Slopes (OLS Regression), Stint Deltas
       │
       ▼
[5. API Serving Layer (FastAPI)] ──> REST Endpoints (Cached JSON)
       │
       ▼
[6. Web UI (Split-Pane Dashboard)] ──> Left: Controls & Config | Right: Charts & Analysis
```

### 1. Ingestion & Raw Caching Layer
- **Data Sources**: Official lap timings, tyre stints, race control messages, and telemetry intervals via OpenF1 and FastF1.
- **Storage**: Sessions and lap streams are cached locally in Apache Parquet and JSON in `data/cache/` to eliminate network latency and avoid API rate limits.

### 2. Cleaning & Neutralization Filtering
- **Out-Laps & In-Laps**: Invalidate non-representative pit entry/exit laps using stint start/end timestamps and telemetry flags.
- **SC/VSC Periods**: Automatically parsed from Race Control messages and stint pace outlier bounds (>108% median pace).
- **Traffic Isolation**: Laps driven within $1.2\text{s}$ of the preceding car are flagged as dirty air laps and isolated from baseline degradation calculations.

### 3. Feature Correction (The Crucial Step)
$$\text{Corrected Lap Time} = \text{Raw Lap Time} + (\text{Lap Number} \times \text{Fuel Correction Factor}) - \text{Track Evolution Delta}$$
- Circuit-specific fuel sensitivities (e.g. Sakhir $0.048\text{s}/\text{lap}$, Silverstone $0.052\text{s}/\text{lap}$, Monza $0.038\text{s}/\text{lap}$) expose genuine mechanical and thermal wear.

### 4. Statistical Degradation Engine
- **OLS Regression Wear Slopes**: Fits corrected lap times against tyre age to extract the degradation slope ($\beta_1$ in $s/\text{lap}$) and baseline pace ($\beta_0$).
- **Stint Crossover Points**: Intersects wear curves of different compounds (e.g. Medium vs. Hard) to pinpoint the exact pit window where switching compounds becomes faster.
- **Strategic Diagnostic ("What Makes Other Teams' Tyres Last Longer?")**: Explains downforce vs micro-sliding, thermal overheating windows, dirty air exposure, and chassis traction management between drivers and constructors.

---

## 🖥️ Split-Pane Dashboard Layout

```
┌───────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ LEFT PANE: CONTROLS & CONFIG                  │ RIGHT PANE: CHARTS & STRATEGIC OUTPUTS                 │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • Season & GP Circuit (2024 / 2023 / 2022)    │ • KPI Banner: Driver/Team, Tyre Age (e.g. 14 laps),     │
│ • Mode Switcher: Driver vs. Constructor Mode   │   Degradation Rate (s/lap), Total Stints               │
│ • Baseline Entity Selector (Verstappen, etc.) │ • ScatterDegradation: Lap Time vs Tyre Age + OLS lines │
│ • Rival Multi-Select (Competitor Racers/Teams)│ • PaceTimeline: Full GP trajectory + Pit stop markers  │
│ • Pirelli Compound Toggles (Soft, Med, Hard)  │ • CompoundDeltaBar: Degradation rate comparison        │
│ • Feature Correction: Fuel Slider (s/lap)     │ • StrategySummary: Stints & Crossover pit windows      │
│ • Traffic Filter: Drop Dirty Air (<1.2s gap)  │ • WearFactorCard: "What makes other tyres last longer?"│
└───────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/Abi26510/F1-Tyre-Degradation.git
cd F1-Tyre-Degradation
```

### 2. Backend Setup & Startup
```powershell
# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend unit tests
python -m pytest backend/tests -v

# Start FastAPI backend server (port 8000)
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API documentation will be available at: `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup & Startup
```powershell
# In a new terminal, navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run the automated backend test suite:
```powershell
python -m pytest backend/tests -v
```
**Test coverage includes:**
- Stint attribution and exact tyre age calculation
- Safety Car and VSC message range identification
- Representative lap filtering (pit laps, standing starts, pace outliers)
- Linear regression wear slope fitting ($s/\text{lap}$) and $R^2$ validation
- Fuel correction unmasking true tyre degradation
- Compound crossover pit window calculations

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── sessions.py         # Years, circuits, drivers, constructors
│   │   │   ├── drivers.py          # Driver scatter data & wear regressions
│   │   │   ├── teams.py            # Constructor aggregations & rival deltas
│   │   │   └── comparisons.py      # Circuit sensitivities & rankings
│   │   ├── core/
│   │   │   ├── config.py           # Circuit fuel factors & livery palettes
│   │   │   └── cache.py            # Parquet & JSON cache manager
│   │   ├── services/
│   │   │   ├── fastf1_client.py    # OpenF1/FastF1 extraction client
│   │   │   ├── cleaning.py         # In/out-lap, SC/VSC, dirty air filtering
│   │   │   ├── normalizer.py       # Fuel load & track evolution normalization
│   │   │   └── degradation.py      # OLS wear engine & strategic diagnostics
│   │   ├── schemas/
│   │   │   ├── filter.py           # Request models
│   │   │   └── analysis.py         # Response models
│   │   └── main.py                 # FastAPI application entrypoint
│   ├── requirements.txt
│   └── tests/
│       ├── test_cleaning.py
│       └── test_degradation.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── ScatterDegradation.tsx
│   │   │   │   ├── PaceTimeline.tsx
│   │   │   │   └── CompoundDeltaBar.tsx
│   │   │   ├── controls/
│   │   │   │   ├── SessionPicker.tsx
│   │   │   │   ├── ModeToggle.tsx
│   │   │   │   ├── EntitySelect.tsx
│   │   │   │   └── CompoundFilter.tsx
│   │   │   ├── insights/
│   │   │   │   ├── StrategySummary.tsx
│   │   │   │   └── WearFactorCard.tsx
│   │   │   └── layout/
│   │   │       ├── SplitView.tsx
│   │   │       ├── LeftSidebar.tsx
│   │   │       └── RightContent.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/cache/                      # Local telemetry cache (.gitkeep)
├── .gitignore                       # Ignores context/, cache files, node_modules
├── task.md                          # Implementation roadmap
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License.
