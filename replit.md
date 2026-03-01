# Production Planning AI Copilot

## Overview

A frontend-only React application for production planning with an Excel-first "Antigravity Ingestion" architecture. Users upload Excel production plans which activate contextual insights across capacity prediction, bottleneck detection, and what-if simulations.

## Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (port 5000)
- **Routing**: react-router-dom v6
- **State/Data**: AppContext (React Context) with localStorage persistence
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Forms**: react-hook-form + zod
- **Excel Parsing**: SheetJS (xlsx)

## Project Structure

```
src/
  App.tsx              - Root app with routing
  main.tsx             - Entry point
  types/
    upload.ts          - UploadContext, UploadMeta, PlanRowLong types
  pages/
    UploadPage.tsx     - Landing page (Excel upload with drag/drop)
    Index.tsx          - Dashboard overview (at /dashboard)
    PlannerPage.tsx    - Production planner
    BottlenecksPage.tsx - Bottleneck detection
    SimulationsPage.tsx - What-if simulations
    ReportsPage.tsx    - Reports
    ops/
      IngestionTab.tsx - Data ingestion monitor
      FeedbackTab.tsx  - Planned vs actual feedback
  components/
    layout/
      AppLayout.tsx       - Main layout with sidebar + header
      ProtectedRoute.tsx  - Route guard (redirects to / if no upload)
      UploadContextBanner.tsx - Banner showing active upload context
    dashboard/           - 5 dashboard cards (contextual when upload active)
  context/
    AppContext.tsx     - Global state: activeUpload, uploadHistory, plans, scenarios
  lib/
    excel/
      parsePlanUpload.ts - Excel → UploadContext parser (wide→long format)
  data/
    sampleData.ts      - Mock stations, lines, plans
    mockEngine.ts      - Prediction, validation, bottleneck engines
    measuredBaseline.ts - Deterministic daily capacity from mock stations
    planComparison.ts  - Dashboard summary, deviation log, scenario baseline builders
    pipelineData.ts    - Ingestion events, deviations mock data
```

## Pages & Routes

- `/` - Upload page (landing, no auth required)
- `/dashboard` - Overview dashboard (protected)
- `/planner` - Production planner (protected)
- `/bottlenecks` - Bottleneck detection (protected)
- `/simulations` - What-if simulations (protected)
- `/reports` - Reports with Ingestion + Feedback tabs (protected)

## Key Features

### Excel Upload Flow
- Drag/drop or browse for .xlsx/.xls/.csv files
- Parser detects date columns (YYYY-MM-DD), converts wide→long format
- Creates UploadContext with meta, rows, and aggregates
- Persisted to localStorage (capped at 5 upload history entries)

### Contextual Dashboard
- When activeUpload is set, all 5 dashboard cards show static KPIs from upload data
- No looping animations/intervals in contextual mode
- Cards derive data from `buildDashboardSummary(activeUpload)`

### Route Guard
- ProtectedRoute redirects to `/` if no activeUpload in context
- Upload page is always accessible

### Upload Context Persistence
- activeUpload stored in localStorage key `activeUpload`
- Upload history stored in localStorage key `uploadHistory`
- Upload bank stored in localStorage key `uploadContexts` (max 5)

## Workflow

- **Start application**: `npm run dev` on port 5000
