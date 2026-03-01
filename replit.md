# Production Planning AI Copilot

## Overview

A frontend-only React application for production planning, imported from Lovable. It provides capacity prediction, plan validation, bottleneck detection, and what-if simulations for manufacturing operations.

## Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (port 5000)
- **Routing**: react-router-dom v6
- **State/Data**: TanStack Query v5
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Forms**: react-hook-form + zod

## Project Structure

```
src/
  App.tsx           - Root app with routing
  main.tsx          - Entry point
  pages/            - Page components (Index, Planner, Bottlenecks, Simulations, Reports, NotFound)
  components/       - Shared UI components
  context/          - AppContext for global state
  hooks/            - Custom React hooks
  data/             - Static/mock data
  lib/              - Utility functions
```

## Pages

- `/` - Overview / Dashboard
- `/planner` - Production Planner
- `/bottlenecks` - Bottleneck Detection
- `/simulations` - What-If Simulations
- `/reports` - Reports

## Workflow

- **Start application**: `npm run dev` on port 5000
