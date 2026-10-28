# Implementation Roadmap: Tyre Degradation Analysis Platform

## Phase 1: Data Ingestion & Base Cleaning
- [x] Set up Python environment with `fastf1`, `pandas`, `numpy`, and `scipy`.
- [x] Build `fastf1_client.py` to fetch full Grand Prix session lap data with persistent local caching.
- [x] Implement out-lap and in-lap removal based on `LapStartTime` and pit lane timestamps.
- [x] Implement track status filtering to drop laps under Yellow, Safety Car (SC), and Virtual Safety Car (VSC).
- [x] Implement traffic isolation: tag or drop laps where time gap to car ahead is < 1.2s.

## Phase 2: Fuel Correction & Statistical Modeling
- [x] Implement circuit-specific fuel-penalty adjustments (default baseline: 0.045s/lap).
- [x] Calculate corrected lap time column: `LapTime_Corrected = RawLapTime + (LapNumber * FuelFactor)`.
- [x] Build tyre degradation model using Ordinary Least Squares (OLS) regression:
  - Input: Tyre Age (Laps on current compound).
  - Output: Degradation rate in seconds per lap ($s/\text{lap}$) and baseline pace ($y$-intercept).
- [x] Calculate stint-level degradation summaries grouped by `[Driver, Compound, StintNumber]`.
- [x] Implement constructor-level aggregation averaging both team drivers' non-traffic stints.

## Phase 3: Analytical API Layer (FastAPI)
- [x] Initialize FastAPI project with CORS configured for local frontend development.
- [x] Create `GET /api/v1/sessions` endpoint returning available years, circuits, and session types.
- [x] Create `POST /api/v1/analysis/driver` endpoint:
  - Input: `year`, `circuit`, `driver_id`, `compounds`, `apply_fuel_correction`.
  - Output: Filtered laps, fitted trendline coordinates, degradation rate, stint summary.
- [x] Create `POST /api/v1/analysis/constructor` endpoint:
  - Input: `year`, `circuit`, `team_name`, `benchmark_team_name`.
  - Output: Aggregated wear slopes, compound deltas, and pace longevity comparisons.
- [x] Add unit tests verifying fuel correction logic and regression accuracy against known race baselines.

## Phase 4: Frontend Layout & Interactive Controls (Left Pane)
- [x] Scaffold Vite + React (TypeScript) + Tailwind CSS application.
- [x] Build responsive split-pane layout: Fixed/collapsible left sidebar, scrollable right canvas.
- [x] Build session selector (Year dropdown, Circuit picker with track layout mini-map).
- [x] Build Mode Toggle: `Driver Mode` vs. `Constructor Mode`.
- [x] Build Entity Selectors:
  - Driver Mode: Select target driver + comparison competitors.
  - Constructor Mode: Select target constructor + competitor teams.
- [x] Build Compound Filters: Multi-select pill buttons (Soft / Medium / Hard) with official Pirelli color accents.
- [x] Manage global selection state using React Context or custom hooks.

## Phase 5: Visualizations & Diagnostic Cards (Right Pane)
- [x] Integrate charting system (interactive SVG/Canvas chart modules):
- [x] Build **ScatterDegradation** component:
  - Scatter plot of Lap Time vs. Tyre Age.
  - Solid regression lines representing compound wear slopes.
  - Tooltips displaying lap number, raw lap time, corrected lap time, and tyre life.
- [x] Build **PaceTimeline** component:
  - Full race timeline showing stint switches, pit stop deltas, and safety car phases.
- [x] Build **CompoundDeltaBar** component:
  - Bar graph comparing degradation rates ($s/\text{lap}$) across drivers/constructors.
- [x] Build **Strategic Diagnostic Card** ("Why do other tyres last longer?"):
  - Surface metrics explaining wear deltas (e.g., high-speed vs. low-speed downforce efficiency, cornering speeds from telemetry, lockup frequency, and tyre management efficiency).

## Phase 6: End-to-End Validation & Polish
- [x] Benchmark data against high-degradation races (e.g., Bahrain or Barcelona) to confirm degradation curve accuracy.
- [x] Add loading skeletons and error boundaries for data fetch states.
- [x] Optimize payload sizes (round floating-point numbers, omit unnecessary telemetry columns).
- [x] Verified full build and automated test suites.
