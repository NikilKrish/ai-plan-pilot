

# Upgrade Dashboard to Interactive Mini-App

This is a large upgrade that transforms the static animated dashboard into a functional single-page application with routing, sample data, mock AI engine, and 4 new pages.

## Architecture

```text
src/
├── data/
│   ├── sampleData.ts          # lines, stations, plans, kbSnippets
│   └── mockEngine.ts          # predictCapacity, validatePlan, rankBottlenecks, simulateScenario
├── context/
│   └── AppContext.tsx          # Global state provider (selectedLineId, activePlan, predictions, history, etc.)
├── components/
│   ├── NavLink.tsx             # (update) Active nav link styling
│   ├── layout/
│   │   └── AppLayout.tsx       # Sticky header + nav + view container
│   ├── shared/
│   │   ├── Toast.tsx           # Reusable toast system (success/info/error)
│   │   ├── Skeleton.tsx        # Loading skeleton components
│   │   └── FormField.tsx       # Inline validated form fields
│   └── dashboard/
│       ├── DashboardHeader.tsx  # (remove standalone header, merge into AppLayout)
│       ├── CapacityPredictor.tsx # Keep animations, no changes needed
│       ├── FeasibilityValidator.tsx # Add "Open Planner" button, wire to global plan state
│       ├── BottleneckDetection.tsx  # Wire rows to rankBottlenecks(), add "Generate Recommendation"
│       ├── WhatIfSimulation.tsx     # Wire "Run" button to simulateScenario(), update scenario cards
│       └── AIRecommendations.tsx    # Wire "Apply" button to navigate to Simulations
├── pages/
│   ├── Index.tsx               # Overview (existing grid)
│   ├── PlannerPage.tsx         # Form + results card
│   ├── BottlenecksPage.tsx     # Filter + table + detail drawer
│   ├── SimulationsPage.tsx     # Baseline + adjustments + comparison bars
│   └── ReportsPage.tsx         # Scenario history table + insights + export
└── App.tsx                     # Hash-based routing with 5 routes
```

## Implementation Steps

### 1. Sample Data (`src/data/sampleData.ts`)
- `lines`: 3 production lines (LINE_A, LINE_B, LINE_C)
- `stationsByLine`: 8-10 stations per line with `meanCycleTimeSec`, `variancePct`, `downtimeMinPerShift`, `scrapPct`
- `plans`: 3 preset plan templates with `lineId`, `workingHours`, `shifts`, `plannedUnits`, `taktTimeSec`, dates
- `scenarioHistory`: starts empty
- `kbSnippets`: 5-6 definitions (cycle time vs takt time, bottleneck definition, downtime effects, etc.)

### 2. Mock AI Engine (`src/data/mockEngine.ts`)
Deterministic functions using the formulas specified:
- `predictCapacity(plan, stations)` → `{ predictedCapacityUnits, confidence, drivers[] }`
- `validatePlan(plan, predictedCapacity)` → `{ feasible, overloadPct/idlePct, warnings[] }`
- `rankBottlenecks(stations)` → top 5 ranked with reason strings
- `simulateScenario(plan, adjustments)` → `{ utilizationDelta, overloadDelta, bottleneckCountDelta, feasibleAfter }`

### 3. Global State (`src/context/AppContext.tsx`)
React Context with:
- `selectedLineId`, `activePlan`, `lastPrediction`, `lastValidation`, `lastBottlenecks`
- `scenarioHistory` array (persisted to localStorage optionally)
- `settings.reducedMotion` boolean
- Actions: `setPlan`, `addScenario`, `navigate`, `setLine`

### 4. App Layout & Navigation (`src/components/layout/AppLayout.tsx`)
- Sticky top header bar with title/subtitle on left
- Right-side nav: Overview, Planner, Bottlenecks, Simulations, Reports (pill-style links)
- Dark mode toggle preserved
- Status pills ("Data: Synthetic Demo", "Latency: 1.2s")

### 5. Routing (`src/App.tsx`)
- Use `react-router-dom` hash-based routing (`HashRouter` or hash paths)
- Routes: `/` (Overview), `/planner`, `/bottlenecks`, `/simulations`, `/reports`
- Wrap everything in `AppProvider`

### 6. Wire Existing Card Buttons

**Card 2 (FeasibilityValidator):**
- Add "Open Planner" button below Export Verdict
- On click: navigate to `/planner`, set `activePlan` from current typewriter target
- Typewriter cycles also update global `activePlan` context

**Card 3 (BottleneckDetection):**
- Clicking a row manually (not just cursor animation) expands details from `rankBottlenecks()` using selected line's stations
- Add "Generate Recommendation" button in expanded drawer
- On click: build recommendation string from `kbSnippets` + station reason, show in styled callout

**Card 4 (WhatIfSimulation):**
- "Run" button calls `simulateScenario()` with default +1 shift adjustment
- Pushes result to `scenarioHistory`
- Shows toast "Scenario completed in 1.2s"
- Updates scenario carousel to include newest result

**Card 5 (AIRecommendations):**
- "Apply" button: applies suggested adjustment to active plan, navigates to `/simulations` with pre-filled adjustment, shows toast "Draft scenario created"

### 7. New Pages

**PlannerPage:**
- Left: Form card with Line select (A/B/C), Working Hours slider (6-12), Shifts select (1-3), Planned Units input
- Buttons: "Predict Capacity" (runs `predictCapacity`), "Validate Plan" (runs `validatePlan`), "Export JSON" (downloads blob)
- Right: Results card with capacity number + confidence progress bar, feasibility pill + warnings list
- 600-900ms simulated loading with skeleton

**BottlenecksPage:**
- Line filter dropdown
- Table/list of top stations from `rankBottlenecks()`
- Click row → detail drawer with insights + "Generate Recommendation" callout
- Styled consistently with dashboard cards

**SimulationsPage:**
- Baseline plan display
- Adjustment controls: shift (+/- 1), working hours (+/- 1), downtime % (+/- 5), scrap % (+/- 1)
- "Run Scenario" button → `simulateScenario()`, adds to history
- Comparison section with CSS-only bar charts showing before/after deltas

**ReportsPage:**
- Scenario History table (last 10 runs) with timestamp, line, adjustments, result
- "Export All" button downloads full history as JSON
- Insights panel: best scenario, worst bottleneck frequency, average feasibility rate
- LocalStorage persistence toggle
- Manual reduced motion toggle

### 8. UX Polish
- Custom toast system component (success green, info blue, error red) with auto-dismiss
- Loading skeletons (600-900ms random delay) before showing prediction/validation results
- Inline form validation with red error messages
- `prefers-reduced-motion` check sets `settings.reducedMotion` on mount
- Manual toggle on Reports page overrides it

## Technical Notes
- All data is in-memory JS, no external fetches
- Uses `react-router-dom` already installed for routing
- Toast uses custom lightweight component (not radix) for the in-card toasts; page-level toasts use sonner
- Skeleton component already exists at `src/components/ui/skeleton.tsx`
- Existing card animations continue running on Overview page unchanged

