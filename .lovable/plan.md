

# Revamp: Reports → Ops & Feedback (Architecture-Aligned)

## Summary
Transform the Reports page into a 5-tab "Ops & Feedback" hub mirroring the PDF architecture. Add pipeline health pills to the dashboard header. Add cross-page deep links. All mock data, no API calls, existing design system preserved.

## Implementation Steps

### Step 1: Create `src/data/pipelineData.ts`
All new mock data in one file:
- `pipelineHealth` — streaming (Kafka, status/lag/lastEvent/validationPct) + batch (MES/Planning DB, lastSync/rows/errors)
- `ingestionEvents` — 20 events with ts, sourceType, entityType, lineId, stationId, status (validated/dropped), reason
- `featureSnapshots` — per line+station: availabilityPct, effectiveCycleTimeSec, downtimeNormalizedPct, rollupLevel, ts (derived from existing station data)
- `modelRuns` — 5 model objects matching PDF page 9 table (ARIMA/LSTM, Regression/ML, Supervised ML, Rules/Classification, Constraint Optimization) each with ts, status, confidence, drift, notes, techniqueLabel, inputs, outputs, whyItMatters
- `deviationLog` — 20 entries with planned/actual/gap/reasonCode/actionTaken/resolved
- `kpiImpact` — beforeAfter using exact PDF values from pages 11-13
- `kpiMapping` — 5 rows from PDF page 11 table
- Extended `kbSnippets` — 6 more definitions (effective cycle time, downtime forecast, bottleneck threshold, availability calc, OEE, drift detection)

### Step 2: Create 5 tab components (parallel)

**`src/pages/ops/IngestionTab.tsx`**
- Two status cards top row (streaming + batch) with status pill, lag, timestamp, validation %
- Validated Events table (last 20) with Line and Source type filter selects
- Schema Validation mini-card with CSS pass rate bar
- "Simulate New Event" button — appends event, updates timestamps, shows toast

**`src/pages/ops/FeaturesTab.tsx`**
- Line selector (A/B/C) using existing select style
- 3 metric cards: Availability %, Effective Cycle Time, Downtime Normalized %
- Station table: Station | Availability | Eff Cycle Time | Downtime Norm | Scrap Proxy | Trend (CSS mini-bars)
- Row click opens Sheet drawer with station→line roll-up
- Accepts `preselectedLine` and `preselectedStation` props for deep linking

**`src/pages/ops/ModelsTab.tsx`**
- 5 model cards in responsive grid (matching PDF's AI Model Selection Rationale)
- Each card: status pill, last run, confidence %, drift badge, "View run details"
- "View run details" opens Sheet with inputs, outputs, "Why it matters"
- "Run All Models (Mock)" button — skeleton 800ms then update timestamps
- Accepts `highlightModel` prop for deep linking

**`src/pages/ops/FeedbackTab.tsx`**
- Summary cards: Planned Units, Actual Units, Gap %, Trend
- Deviation Log table (last 20) with reason codes and severity pill
- Retraining card: last retrain, next scheduled, data freshness
- "Mark deviation resolved" per-row action with toast

**`src/pages/ops/KpiImpactTab.tsx`**
- KPI Mapping table (AI Model → Key KPIs → Business Value)
- Before vs After grouped into 5 categories with exact PDF values
- "One Slide Summary" callout card with 5 headline improvements

### Step 3: Rewrite `src/pages/ReportsPage.tsx`
- Rename header to "Ops & Feedback"
- Add pill-style tab bar: Ingestion | Features | Models | Feedback | KPI Impact
- Read URL search params (`useSearchParams`) for deep linking (`?tab=features&line=LINE_A`, `?tab=models&highlight=capacityPrediction`, `?tab=feedback`)
- Each tab renders its component
- Existing history table + insights + settings move under Feedback tab or remain as a collapsible section

### Step 4: Update `src/components/layout/AppLayout.tsx`
- Change nav label "Reports" → "Ops & Feedback" (route stays `/reports`)
- Add Pipeline Health pill group in header (next to existing "Synthetic Demo" pill):
  - Streaming: colored dot + "Healthy"
  - Batch: colored dot + "Healthy"
  - Freshness: "2m ago"

### Step 5: Add cross-page links
- **`src/pages/BottlenecksPage.tsx`** — Add "View feature drivers" button → `/reports?tab=features&line={lineId}`
- **`src/pages/PlannerPage.tsx`** — Add "View model confidence" button → `/reports?tab=models&highlight=capacityPrediction`
- **`src/pages/SimulationsPage.tsx`** — Add "Track actuals" button → `/reports?tab=feedback`

## Technical Notes
- All data in-memory with `useState` for mutable state (event simulation, deviation resolution)
- Tab selection via `useSearchParams` from react-router-dom — no new dependencies
- Reuse existing patterns: `bg-card rounded-3xl shadow-sm border border-border`, skeleton loaders, toast via sonner, status pills with dot indicators, Sheet component for drawers
- Responsive: mobile-first grid layouts matching existing patterns
- No theme changes, no new fonts, no new color tokens

