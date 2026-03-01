# Implementation Plan (Antigravity Ingestion)
## Project: Excel-first “Production Planning AI Copilot” (contextual dashboard)

### Goal (what we’re changing)
Revamp the existing React + Vite + TypeScript dashboard so the **first screen is an Excel upload**. After upload, the app synthesizes the spreadsheet into an **active upload context** and renders the existing dashboard/features **AS-IS**, but **contextual**:
- Dashboard cards become **static** (no looping animations) and show KPIs derived from the uploaded plan and measured baseline signals.
- All screens (Planner / Bottlenecks / Simulations / Ops & Feedback) read from the same `upload_id` context.
- Users can switch context (new upload / historical uploads) and compare plan vs measured/historical signals.

---

## Current codebase snapshot (what exists today)
**Tech stack**
- React 18 + Vite + TypeScript, Tailwind, shadcn/ui, react-router-dom, TanStack Query, Sonner.
- Central state via `src/context/AppContext.tsx`.

**Routes**
- `src/App.tsx`: `/` (Overview), `/planner`, `/bottlenecks`, `/simulations`, `/reports` (Ops & Feedback).

**Overview dashboard**
- `src/pages/Index.tsx` renders 5 animated feature cards:
  - `src/components/dashboard/*` (CapacityPredictor, FeasibilityValidator, BottleneckDetection, WhatIfSimulation, AIRecommendations)
- Each card navigates to a feature screen.

**Ops & Feedback**
- `src/pages/ReportsPage.tsx` already implements tabs:
  - `src/pages/ops/*` (IngestionTab, FeaturesTab, ModelsTab, FeedbackTab, KpiImpactTab)
- Mock pipeline data lives in `src/data/pipelineData.ts`.

**Mock “engine”**
- Deterministic helpers in `src/data/mockEngine.ts`:
  - `predictCapacity`, `validatePlan`, `rankBottlenecks`, `simulateScenario`
- Sample line/station/plan data in `src/data/sampleData.ts`.

---

## What “Excel-first contextual mode” introduces
### New concept: Upload Context (single source of truth)
Create and propagate a single `upload_id` context:
- **Meta**: filename, created_at, detected date range, line(s)/plant(s)
- **Normalized plan rows** (wide → long)
- **Aggregates**: planned totals per day/line, plannedUnits total, etc.
- **Comparison outputs**: plan vs measured (gap, feasibility, bottlenecks, what-if baseline)

This context becomes the key for:
- Dashboard card KPIs
- Planner prefill
- Bottleneck filtering
- Simulations baseline
- Feedback tab planned vs actual reconciliation
- History switching

---

# Phase 0 — Dependencies + Types + Contracts (foundation)
## 0.1 Add Excel parsing dependency
**Add dependency**
- Add `xlsx` (SheetJS) to `package.json` dependencies.

**Acceptance**
- `npm install` passes.
- `vite dev` runs unchanged.

## 0.2 Add Upload contracts (Typescript)
Create: `src/types/upload.ts`
```ts
export type UploadId = string;

export interface UploadMeta {
  uploadId: UploadId;
  filename: string;
  createdAt: string; // ISO
  plant?: string;
  lineIds: string[];
  dateStart?: string; // ISO date
  dateEnd?: string;   // ISO date
  rowCount: number;
}

export interface PlanRowLong {
  uploadId: UploadId;
  plant?: string;
  line?: string;
  vcNo?: string;
  buildCardNumber?: string;
  colourCode?: string;
  evrNumber?: string;
  planDate: string;       // ISO date
  plannedUnits: number;   // integer >= 0
  raw: Record<string, unknown>; // for audit/debug
}

export interface UploadContext {
  meta: UploadMeta;
  rows: PlanRowLong[];
  aggregates: {
    plannedUnitsTotal: number;
    plannedUnitsByLine: Record<string, number>;
    plannedUnitsByDay: Record<string, number>;
    plannedUnitsByLineDay: Record<string, Record<string, number>>;
  };
}
```

**Acceptance**
- Types compile.
- No runtime changes yet.

---

# Phase 1 — Excel Upload Page (new first screen)
## 1.1 Create UploadPage UI
Create: `src/pages/UploadPage.tsx`
- Use existing shadcn components (`Card`, `Button`, `Input`, `Skeleton`, `Toast/Sonner`).
- UX states:
  - idle: drop zone + “Browse file”
  - parsing: stepper text: “Uploading → Validating → Normalizing → Building dashboard”
  - success: show detected meta + CTA “Continue to dashboard”
  - error: show validation errors (missing headers, no data rows, invalid date columns)

**Acceptance**
- UploadPage renders correctly, matches existing design system.
- Errors are visible and non-blocking to rest of app.

## 1.2 Implement client-side parsing (wide → long)
Create: `src/lib/excel/parsePlanUpload.ts`
- Inputs: `File`
- Output: `UploadContext`
- Parsing rules (based on the provided template):
  - Treat **Sheet 1** as main plan sheet.
  - First row is header. Columns include metadata fields then date columns (`YYYY-MM-DD`).
  - Data rows start from row index 1.
  - Convert wide to long:
    - For each row, for each date column with numeric value, emit `PlanRowLong`.
  - Validation:
    - Must have at least one date column.
    - Must have at least one data row producing ≥ 1 `PlanRowLong`. If only headers exist, return a friendly error: “No plan rows found. Please fill daily quantities.”

**Acceptance**
- Parsing works with:
  - (a) an empty template (returns friendly error)
  - (b) a filled template (creates long rows and aggregates)

## 1.3 Add “Upload history” panel (simple)
On UploadPage:
- Show a small list of last 5 uploads (from localStorage) with:
  - filename, createdAt, plannedUnitsTotal, date range
- Clicking an item loads that context and routes to dashboard.

**Acceptance**
- History list appears after first successful upload.
- Can restore context without re-uploading.

---

# Phase 2 — Routing + Navigation gating (upload must be first screen)
## 2.1 Update routes
Edit: `src/App.tsx`
- Change routes:
  - `/` → `UploadPage`
  - `/dashboard` → existing `Index` (Overview)
  - Keep existing feature routes unchanged.

## 2.2 Update navbar links
Edit: `src/components/layout/AppLayout.tsx`
- Update navItems:
  - Overview should point to `/dashboard` (not `/`)
- Add a “Context pill” region in header (right side) to show:
  - active upload filename (truncated)
  - date range
  - CTA: “Switch” (routes to `/`)

## 2.3 Route guard (cannot access dashboard without upload context)
Implement a lightweight guard:
- If `activeUpload` is null:
  - navigating to `/dashboard` or any feature route redirects to `/`
  - show toast: “Upload a plan file first”

**Where**
- Option A: Guard in `AppLayout` using `useLocation` + `Navigate`.
- Option B: Create `ProtectedRoute` wrapper.

**Acceptance**
- Fresh load always lands on upload screen.
- After upload, “Continue” routes to `/dashboard`.
- Refresh on `/dashboard` restores last context if stored; otherwise redirects to `/`.

---

# Phase 3 — AppContext upgrade (store active upload context)
## 3.1 Extend AppContext
Edit: `src/context/AppContext.tsx`
Add:
- `activeUpload: UploadContext | null`
- `uploadHistory: UploadMeta[]` (or `UploadContext[]` capped)
- actions:
  - `setActiveUpload(ctx: UploadContext)`
  - `clearActiveUpload()`
  - `loadUpload(uploadId: string)`

Persist:
- Store `activeUpload.meta` + aggregates + (optionally) `rows` in localStorage.
- Cap stored rows to avoid storage blow-up; for demo you can store full rows but cap to N uploads.

**Acceptance**
- Upload context available across app via `useApp()`.
- “Switch context” clears context and routes back to UploadPage.

---

# Phase 4 — Make dashboard cards static + contextual (no looping animations)
## 4.1 Add “context mode” behavior
Rule:
- When `activeUpload != null`, all overview cards:
  - **stop intervals/typewriters/cursor loops**
  - replace animated preview with a **static KPI snapshot** derived from `activeUpload`.

Implementation:
- Use `const { activeUpload, reducedMotion } = useApp()`.
- Consider forcing “reduced motion” in contextual mode for cards only.

## 4.2 Update each card component
Edit:
- `src/components/dashboard/CapacityPredictor.tsx`
- `src/components/dashboard/FeasibilityValidator.tsx`
- `src/components/dashboard/BottleneckDetection.tsx`
- `src/components/dashboard/WhatIfSimulation.tsx`
- `src/components/dashboard/AIRecommendations.tsx`

For each:
- Replace animation with:
  - a KPI number / badge
  - a mini “planned vs predicted” / “top bottleneck” / “best scenario delta” summary
- Keep hover-lift, rounded, shadows, and click navigation.

**Acceptance**
- No infinite loops run when in contextual mode (no intervals).
- Cards show upload-aware metrics.

---

# Phase 5 — Comparison engine: plan vs measured baseline
## 5.1 Define measured baseline contract (POC)
Create: `src/data/measuredBaseline.ts`
- For demo, treat `stationsByLine` as measured signals.
- Provide helper to compute daily “measured capacity” from station stats for the plan’s line/date range.

Create: `src/data/planComparison.ts`
Exports:
- `buildDashboardSummary(uploadCtx, measuredBaseline)` → used by overview cards
- `buildDeviationLog(uploadCtx, measuredBaseline)` → used by Feedback tab
- `buildScenarioBaseline(uploadCtx)` → used by Simulations page

**Acceptance**
- Summary numbers are deterministic for the same upload file.
- Output types stable and reusable.

---

# Phase 6 — Wire upload context into existing screens (minimal UI delta)
## 6.1 PlannerPage: prefill from upload
Edit: `src/pages/PlannerPage.tsx`
- If `activeUpload` exists:
  - default lineId from upload meta
  - plannedUnits from upload aggregates (for selected line and date range)
- Add a small “Upload Context” banner at top showing:
  - filename + date range + “Change file” CTA

## 6.2 BottlenecksPage: filter by upload line
Edit: `src/pages/BottlenecksPage.tsx`
- Default to upload-selected line
- Use `planComparison` outputs to rank bottlenecks in the context of planned load

## 6.3 SimulationsPage: baseline = uploaded plan
Edit: `src/pages/SimulationsPage.tsx`
- Use upload plan as baseline plan.
- When user runs scenario, store `scenarioHistory` as today but include `uploadId` in ScenarioRecord.

## 6.4 Ops & Feedback: show “plan upload ingestion” + contextual feedback
Edit:
- `src/pages/ops/IngestionTab.tsx`: add one “plan_upload” event type row when upload occurs.
- `src/pages/ops/FeedbackTab.tsx`: compute planned units from upload and derive actual units from baseline (or existing deviations), so totals reflect uploaded plan.

**Acceptance**
- Every page shows which upload is active.
- Switching upload updates the whole app.

---

# Phase 7 — QA, tests, and ergonomics
## 7.1 Add unit tests for Excel parser
Create:
- `src/test/parsePlanUpload.test.ts`
- Add a small fixture strategy:
  - either store a tiny xlsx fixture under `src/test/fixtures/`
  - or mock SheetJS parsing output (preferred for repo size)

Test cases:
- empty template → error
- filled file → rows > 0, correct aggregates

## 7.2 Guard against performance issues
- Don’t render thousands of rows directly.
- Aggregate for UI; render details only on drilldown.

## 7.3 Developer workflow (Antigravity/Cursor)
Add prompts below to enforce consistent code generation and reduce drift.

---

# Antigravity Prompts (copy/paste per phase)
## Prompt A — Excel parsing module
“You are implementing client-side Excel parsing for a React+TS app. Add SheetJS (`xlsx`) and create `parsePlanUpload(file: File)` that:
- reads Sheet 1
- treats first row as header
- detects date columns in `YYYY-MM-DD` format
- converts wide to long records
- validates at least one data row exists
- returns typed `UploadContext` including aggregates.
Include robust error messages and unit tests.”

## Prompt B — UploadPage UI
“Create `UploadPage.tsx` using existing shadcn components. Implement drag/drop + browse. Show progress states and validation errors. On success call `setActiveUpload(ctx)` and navigate to `/dashboard`. Keep styling consistent.”

## Prompt C — Route gating + navbar update
“Update React Router routes: `/` becomes UploadPage, `/dashboard` becomes Overview. Update `AppLayout` nav links accordingly and add a context pill showing active upload filename. Add a ProtectedRoute guard that redirects to upload if no activeUpload.”

## Prompt D — Disable animations in contextual mode
“Update dashboard card components so if `activeUpload` exists, they render static KPI snapshots and do NOT run setInterval/typewriter loops. Keep hover-lift and click navigation.”

---

# Done definition (project-level)
- App opens on UploadPage.
- Uploading a filled Excel file creates an active context and routes to `/dashboard`.
- Dashboard cards are static and show upload-derived metrics.
- All feature screens operate in the uploaded context, with easy “Switch context”.
- Ops & Feedback reflects upload ingestion and plan vs actual comparison.
- Parser has tests and clear validation errors.
